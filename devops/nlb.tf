resource "aws_eip" "nlb" {
  count = length(local.azs)

  domain = "vpc"
}

module "nlb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "9.17.0"

  name               = "${local.name}-nlb"
  load_balancer_type = "network"
  create             = true
  vpc_id             = local.vpc_id

  subnet_mapping = [for i, eip in aws_eip.nlb :
    {
      allocation_id = eip.id
      subnet_id     = local.public_subnet_ids[i]
    }
  ]

  security_groups            = []
  enable_deletion_protection = true

  # Security Group
  create_security_group = true
  enforce_security_group_inbound_rules_on_private_link_traffic = "off"
  security_group_ingress_rules = {
    all_traffic = {
      from_port   = -1
      to_port     = -1
      ip_protocol = "-1"
      description = "All traffice"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }
  security_group_egress_rules = {
    all = {
      from_port   = -1
      to_port     = -1
      description = "All egress traffic"
      ip_protocol = "-1"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }


  listeners = {
    for k, v in local.public_nlb_apps : k => {
      port     = v.container_port
      protocol = "TCP_UDP"
      forward = {
        target_group_key = k
      }
    }
  }

  target_groups = {
    for k, v in local.public_nlb_apps : k => {
      name_prefix            = v.target_prefix
      protocol               = "TCP_UDP"
      port                   = v.container_port
      target_type            = "ip"
      create_attachment      = false
      vpc_id                 = local.vpc_id
      connection_termination = true
      preserve_client_ip     = true
      health_check = {
	protocol = "TCP"
        healthy_threshold   = 5
        timeout             = 10
        interval            = try(v.health_check_interval, 30)
        unhealthy_threshold = try(v.health_check_unhealthy_threshold, 2)
      }

      stickiness = {
        type = "source_ip"
      }
    }
  }
}
