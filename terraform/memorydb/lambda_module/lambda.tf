locals {
  usersList  = split(" ", var.sns_users)
  emailsList = local.usersList[0] == "" ? [] : formatlist("%s${var.email_domain}", local.usersList)
}

resource "aws_iam_role" "memorydb_backup_role" {
  name               = "${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}"
  description        = "Allows the AWS Lambda Service"
  assume_role_policy = data.aws_iam_policy_document.lambda_service_assume_role_policy.json
  tags               = tomap(merge(var.default_tags, { Name = "${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}" }))
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  name   = "${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}"
  policy = data.aws_iam_policy_document.lambda_function_policy.json
  role   = aws_iam_role.memorydb_backup_role.name
}

resource "aws_sns_topic" "sns_topic" {
  name                                  = "${var.team}-${var.bucket_id}-${var.sns_topic_id}-${var.environment}-${var.aws_region}"
  kms_master_key_id                     = "alias/aws/sns"
  application_failure_feedback_role_arn = aws_iam_role.memorydb_backup_role.arn
  application_success_feedback_role_arn = aws_iam_role.memorydb_backup_role.arn
  tags                                  = tomap(merge(var.default_tags, { Name = "${var.team}-${var.bucket_id}-${var
  .sns_topic_id}-${var.environment}-${var.aws_region}" }))
}

resource "aws_sns_topic_subscription" "lambda_sns_dlq_email_target" {
  for_each  = toset(local.emailsList)
  topic_arn = aws_sns_topic.sns_topic.arn
  protocol  = "email"
  endpoint  = each.value

  depends_on = [
    aws_sns_topic.sns_topic
  ]
}

resource "aws_lambda_function" "lambda_memorydb_backup" {
  function_name = "${var.team}-${var.bucket_id}-${var.environment}-${var.aws_region}"
  description   = "Lambda MemoryDB Backup function"
  filename      = "${path.module}/lambda_function.zip"
  role          = aws_iam_role.memorydb_backup_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 60

  source_code_hash = data.archive_file.python_lambda_package.output_base64sha256

  dead_letter_config {
    target_arn = aws_sns_topic.sns_topic.arn
  }

  environment {
    variables = {
      RETENTION_LIMIT  = var.snapshot_retention_limit
      TEAM             = var.team
      ENVIRONMENT      = var.environment
      REGION           = var.aws_region
      CLUSTER_IDENTITY = var.cluster_identity
      BUCKET_ID        = var.bucket_id
      TOPIC_ID         = var.sns_topic_id
      ACCOUNT_ID       = data.aws_caller_identity.current_account.account_id
      ARN_REGION       = var.arn_region
    }
  }
  depends_on = [
    aws_iam_role_policy.lambda_role_policy
  ]
  tags = tomap(var.default_tags)
}

resource "aws_lambda_permission" "lambda_permission" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_memorydb_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.event_rule.arn
}

resource "aws_cloudwatch_event_rule" "event_rule" {
  name                = "${var.team}-schedule-${var.bucket_id}-${var.environment}-${var.aws_region}"
  description         = "Schedule MemoryDb Backup"
  schedule_expression = var.event_rule_schedule
  tags                = merge(var.default_tags, {
    Name = "${var.team}-schedule-${var.bucket_id}-${var.environment}-${var.aws_region}"
  })
}

resource "aws_cloudwatch_event_target" "event_target" {
  rule      = aws_cloudwatch_event_rule.event_rule.name
  target_id = "ScheduleRedisBackup"
  arn       = aws_lambda_function.lambda_memorydb_backup.arn
}

resource "aws_cloudwatch_log_group" "cloudwatch_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.lambda_memorydb_backup.function_name}"
  retention_in_days = 30
  tags              = merge(var.default_tags, {
    Name = "/aws/lambda/${aws_lambda_function.lambda_memorydb_backup.function_name}"
  })
}