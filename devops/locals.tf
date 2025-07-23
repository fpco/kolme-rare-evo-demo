locals {
  rng_server_tag = "0bb755971925bb9e216406717d7732c8777a41ae"
}

locals {
  health_check_image_url             = "https://academy.fpblock.com/images/fpblock-favicon.png"
  health_check_notfification_context = "<https://zehut.fpcomplete.com/|Sign into AWS> \n Navigate to AWS ECS console to debug further"
  vpc_id                             = data.aws_vpc.production.id
  public_subnet_ids                  = data.aws_subnets.public.ids
  private_subnet_ids                 = data.aws_subnets.private.ids
  private_subnets_cidr_blocks        = [for subnet in values(data.aws_subnet.private) : subnet.cidr_block]
  default_lb_algorithm               = "round_robin"
  default_autoscaling_policies = {
    cpu = {
      policy_type = "TargetTrackingScaling"

      target_tracking_scaling_policy_configuration = {
        predefined_metric_specification = {
          predefined_metric_type = "ECSServiceAverageCPUUtilization"
        }
      }
    }
    memory = {
      policy_type = "TargetTrackingScaling"

      target_tracking_scaling_policy_configuration = {
        predefined_metric_specification = {
          predefined_metric_type = "ECSServiceAverageMemoryUtilization"
        }
      }
    }
  }
}
