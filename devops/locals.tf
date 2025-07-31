locals {
  rng_server_tag = "64ce1326d69ad75ead7de1101eeeddac103c4ac1"
  guess_game_tag = "64ce1326d69ad75ead7de1101eeeddac103c4ac1"
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
