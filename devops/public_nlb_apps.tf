locals {
  public_nlb_apps = {
    guess-game = {
      name           = "guess-game"
      container_name = "guess-game"
      target_prefix = "game"

      container_port = 3000
      create         = true
      app_image = "ghcr.io/fpco/kolme-rare-evo-demo/guess-game"
      image_tag = local.guess_game_tag
      command = [
        "--app-description",
        "Guess game (ECS production)",
        "guess-game"
      ]
      desired_count                      = 1
      enable_autoscaling                 = false
      deployment_maximum_percent         = 200
      deployment_minimum_healthy_percent = 50
      cpu                                = 256
      memory                             = 512
      cpu_architecture                   = "ARM64"

      load_balancing_algorithm_type = "least_outstanding_requests"
      health_check_path = "/"
      task_exec_secret_arns = []

      environment = [
        { name = "HEALTH_CHECK_APP_VERSION", value = local.guess_game_tag },
        { name = "HEALTH_CHECK_SLACK_WEBHOOK", value = var.HEALTH_CHECK_SLACK_WEBHOOK },
        { name = "HEALTH_CHECK_IMAGE_URL", value = local.health_check_image_url },
        { name = "HEALTH_CHECK_NOTIFICATION_CONTEXT", value = local.health_check_notfification_context },
	{ name = "POSTGRES_CONN_STR", value = var.KOLME_POSTGRES_STORE},
	{ name = "VALIDATOR_SECRET_KEY", value = var.VALIDATOR_SECRET_KEY}
      ]
    }
  }
}
