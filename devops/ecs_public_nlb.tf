module "public-nlb-ecs-service" {
  for_each = local.public_nlb_apps
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

  task_exec_ssm_param_arns = try(each.value.task_exec_ssm_param_arns, [])
  task_exec_iam_statements = []

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
      environment            = each.value.environment
      secrets                = try(each.value.secrets, [])
      command                = each.value.command
      readonlyRootFilesystem = true

      healthCheck = {
        command     = ["CMD-SHELL", "true"] # todo
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
      target_group_arn = try(module.nlb.target_groups[each.key].arn, null)
      container_name   = each.value.container_name
      container_port   = each.value.container_port
    }
  }

  create_security_group = true
  security_group_ingress_rules = {
    nlb_ingress = {
      type                         = "ingress"
      from_port                    = each.value.container_port
      to_port                      = each.value.container_port
      protocol                     = "tcp"
      description                  = "NLB Service port"
      referenced_security_group_id = module.nlb.security_group_id
    }
  }

  security_group_egress_rules = {
    egress_all = {
      ip_protocol = "-1"
      cidr_ipv4   = "0.0.0.0/0"
      type        = "egress"
    }
  }
}
