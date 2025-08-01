locals {
  name = "rareevo"
  public_apps = {
    rng_server = {
      name           = "rng_server"
      container_name = "rng_server"
      # Only hyphen allowed here
      target_group_name = "rng-server"
      container_port    = 3000
      create            = true

      # Used in the application load balancer for host header check to
      # route requests.
      domain_names = [
        "rng.prod.fpcomplete.com"
      ]
      app_image = "ghcr.io/fpco/kolme-rare-evo-demo/rng-server"
      image_tag = local.rng_server_tag
      command = [
        "--app-description",
        "Rng Server (ECS production)",
        "rng-server",
        "serve"
      ]
      desired_count                      = 2
      enable_autoscaling                 = false
      deployment_maximum_percent         = 200
      deployment_minimum_healthy_percent = 50
      cpu                                = 256
      memory                             = 512
      load_balancing_algorithm_type      = "least_outstanding_requests"
      cpu_architecture                   = "ARM64"
      # Health check for ALB
      health_check_path = "/healthz"
      # Health check for ECS task
      health_check_target   = "http://localhost:3000/healthz"
      task_exec_secret_arns = []
      environment = [
        { name = "HEALTH_CHECK_APP_VERSION", value = local.rng_server_tag },
        { name = "HEALTH_CHECK_SLACK_WEBHOOK", value = var.HEALTH_CHECK_SLACK_WEBHOOK },
        { name = "HEALTH_CHECK_IMAGE_URL", value = local.health_check_image_url },
        { name = "HEALTH_CHECK_NOTIFICATION_CONTEXT", value = local.health_check_notfification_context },
        { name = "RARE_EVO_SIGNING_KEY", value = var.RNG_SERVER_SIGNING_KEY },
        { name = "RARE_EVO_HMAC_SECRET", value = var.RNG_SERVER_HMAC_SECRET },
        { name = "RARE_EVO_BIND", value = "0.0.0.0:3000" },
      ]
    }
    guess-game = {
      name           = "guessgame"
      container_name = "guess-game"
      target_prefix = "game"

      container_port = 3000
      create         = true
      app_image = "ghcr.io/fpco/kolme-rare-evo-demo/guess-game"
      image_tag = local.guess_game_tag
      domain_names = [
        "game.prod.fpcomplete.com"
      ]
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
      health_check_path = "/healthz"
      health_check_target   = "http://localhost:3000/healthz"
      task_exec_secret_arns = []

      environment = [
        { name = "HEALTH_CHECK_APP_VERSION", value = local.guess_game_tag },
        { name = "HEALTH_CHECK_SLACK_WEBHOOK", value = var.HEALTH_CHECK_SLACK_WEBHOOK },
        { name = "HEALTH_CHECK_IMAGE_URL", value = local.health_check_image_url },
        { name = "HEALTH_CHECK_NOTIFICATION_CONTEXT", value = local.health_check_notfification_context },
	{ name = "POSTGRES_CONN_STR", value = var.KOLME_POSTGRES_STORE},
	{ name = "VALIDATOR_SECRET_KEY", value = var.VALIDATOR_SECRET_KEY},
	{ name = "BIND", value = "0.0.0.0:3000"}
      ]
    }
  }
}
