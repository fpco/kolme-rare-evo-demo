module "alb_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.2"

  name        = "${local.name}-service"
  description = "Access to the public facing Load Balancer"
  vpc_id      = local.vpc_id

  ingress_cidr_blocks      = ["0.0.0.0/0"]
  ingress_ipv6_cidr_blocks = ["::/0"]
  ingress_rules            = ["http-80-tcp", "https-443-tcp"]

  egress_cidr_blocks      = local.private_subnets_cidr_blocks
  egress_ipv6_cidr_blocks = []
  egress_rules            = ["all-all"]
}


module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "9.11.0"

  name = local.name

  load_balancer_type = "application"
  create             = true
  vpc_id             = local.vpc_id

  subnets         = local.public_subnet_ids
  security_groups = [module.alb_security_group.security_group_id]

  access_logs                = {}
  connection_logs            = {}
  enable_deletion_protection = true

  listeners = {
    https = {
      port                        = 443
      protocol                    = "HTTPS"
      certificate_arn             = module.acm["rng"].acm_certificate_arn
      additional_certificate_arns = [module.acm["game"].acm_certificate_arn]
      fixed_response = {
        content_type = "text/plain"
        status_code  = "404"
      }

      rules = {
        for k, v in local.public_apps : k => {
          actions = [{
            type             = "forward"
            target_group_key = k
          }]

          conditions = [{
            host_header = {
              values = v.domain_names
            }
          }]
        }
      }
    }
  }

  target_groups = {
    for k, v in local.public_apps : k => {
      name              = try(v.target_group_name, v.name)
      backend_protocol  = "HTTP"
      backend_port      = v.container_port
      protocol_version  = try(v.protocol_version, "HTTP1")
      target_type       = "ip"
      create_attachment = false
      # We reduce the deregistration_delay from 300 seconds, to have the
      # new deployment up and running quickly. The side effect of
      # reducing the time is that some requests may fail, but that's
      # okay in this case.
      deregistration_delay          = 10
      load_balancing_algorithm_type = try(v.load_balancing_algorithm_type, local.default_lb_algorithm)
      health_check = {
        path              = try(v.health_check_path, "/")
        enabled           = true
        healthy_threshold = 2
        timeout           = 2
        interval          = 5
      }
    }
  }
}
