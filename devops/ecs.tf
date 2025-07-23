module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "6.0.5"

  name = local.name

  configuration = {
    execute_command_configuration = {
      logging = "OVERRIDE"
      log_configuration = {
        cloud_watch_log_group_name = "/ecs/${local.name}"
      }
    }
  }

  default_capacity_provider_strategy = {
    FARGATE = {
      weight = 100
    }
  }

  create_cloudwatch_log_group = true
  create_task_exec_iam_role   = false

  setting = [{
    name  = "containerInsights"
    value = "enabled"
  }]
}

module "public-apps-ecs-service" {
  for_each = local.public_apps
  source   = "terraform-aws-modules/ecs/aws//modules/service"
  version  = "6.0.5"

  name        = each.value.name
  cluster_arn = module.ecs_cluster.arn

  create                             = each.value.create
  desired_count                      = each.value.desired_count
  enable_autoscaling                 = each.value.enable_autoscaling
  autoscaling_min_capacity           = try(each.value.autoscaling_min_capacity, each.value.desired_count)
  autoscaling_max_capacity           = try(each.value.autoscaling_max_capacity, each.value.desired_count)
  deployment_maximum_percent         = each.value.deployment_maximum_percent
  deployment_minimum_healthy_percent = each.value.deployment_minimum_healthy_percent
  autoscaling_policies               = try(each.value.autoscaling_policies, local.default_autoscaling_policies)

  cpu    = each.value.cpu
  memory = each.value.memory
  runtime_platform = {
    operating_system_family = "LINUX"
    cpu_architecture        = try(each.value.cpu_architecture, "ARM64")
  }

  ignore_task_definition_changes = false
  create_task_definition         = true
  create_task_exec_iam_role      = true
  create_task_exec_policy        = true
  create_tasks_iam_role          = false

  task_exec_secret_arns = each.value.task_exec_secret_arns

  task_exec_iam_statements = []
  task_exec_ssm_param_arns = []

  container_definitions = {
    (each.value.container_name) = {
      cpu                       = each.value.cpu
      memory                    = each.value.memory
      essential                 = true
      enable_cloudwatch_logging = true
      image                     = "${each.value.app_image}:${each.value.image_tag}"
      mountPoints               = []
      volumesFrom               = []
      ulimits                   = try(each.value.ulimits, [])
      user                      = try(each.value.user, "1000")
      portMappings = [
        {
          name          = each.value.container_name
          containerPort = each.value.container_port
          hostPort      = each.value.container_port
          protocol      = "tcp"
        }
      ]
      repository_credentials   = {}
      environment              = each.value.environment
      secrets                  = try(each.value.secrets, [])
      command                  = each.value.command
      readonly_root_filesystem = false # Note: this module changes the default

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider ${each.value.health_check_target}"]
        interval    = 30
        retries     = 10
        startPeriod = 10
        timeout     = 5
      }
    }
  }

  subnet_ids = local.private_subnet_ids

  load_balancer = {
    service = {
      target_group_arn = try(module.alb.target_groups[each.key].arn, null)
      container_name   = each.value.container_name
      container_port   = each.value.container_port
    }
  }

  create_security_group = true
  security_group_ingress_rules = {
    alb_ingress_80 = {
      type                         = "ingress"
      from_port                    = each.value.container_port
      to_port                      = each.value.container_port
      protocol                     = "tcp"
      description                  = "Service port"
      referenced_security_group_id = module.alb.security_group_id
    }
  }

  security_group_egress_rules = {
    egress_all = {
      ip_protocol = "-1"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }
}
