locals {
  rng_server_tag = "a87d02b31850f2d93b05a41a315b766eff6d89f3"
  validator_tag  = "61ffb8a506530f3818622707db71d30938bde473"
  guess_game_tag = "01aa244c9797138bf0ac7cebe69150e7b467d7b0"
}

locals {
  health_check_image_url             = "https://academy.fpblock.com/images/fpblock-favicon.png"
  health_check_notfification_context = "<https://zehut.fpcomplete.com/|Sign into AWS> \n Navigate to AWS ECS console to debug further"
  vpc_id                             = data.aws_vpc.production.id
  vpc_cidr_ipv4                      = data.aws_vpc.production.cidr_block
  public_subnet_ids                  = data.aws_subnets.public.ids
  private_subnet_ids                 = data.aws_subnets.private.ids
  private_subnets_cidr_blocks        = [for subnet in values(data.aws_subnet.private) : subnet.cidr_block]
  default_lb_algorithm               = "round_robin"
  azs                                = slice(data.aws_availability_zones.available.names, 0, 3)
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
