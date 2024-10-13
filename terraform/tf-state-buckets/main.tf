data "template_file" "tfstate_policy" {
  template = file("${path.module}/templates/tfstate-policy.json")

  vars = {
    dynamodb-table = aws_dynamodb_table.tf_state_lock.id
    s3-bucket      = aws_s3_bucket.tf-state.id
  }
}

resource "aws_s3_bucket" "tf-state" {
  bucket = var.s3_bucket_name
  tags   = {
    Name = var.s3_bucket_name
  }
}

resource "aws_dynamodb_table" "tf_state_lock" {
  name           = var.dynamodb_table_name
  hash_key       = "LockID"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = var.dynamodb_table_name
  }

  depends_on = [
    aws_s3_bucket.tf-state
  ]
}

data "aws_iam_policy_document" "tf-state-assume-role-policy" {
  statement {
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "AWS"
      identifiers = [
        for account_id in var.account_ids :account_id
      ]
    }
  }
}

resource "aws_iam_role" "terraform-state-role" {
  name               = "${var.s3_bucket_name}-role"
  assume_role_policy = data.aws_iam_policy_document.tf-state-assume-role-policy.json
}

resource "aws_iam_policy" "terraform-state-policy" {
  name        = "${var.s3_bucket_name}-policy"
  description = "Grants access to bucket/dynamodb tables that contains tf states"

  policy = data.template_file.tfstate_policy.rendered
}

resource "aws_iam_role_policy_attachment" "attach-state-policy-to-role" {
  policy_arn = aws_iam_policy.terraform-state-policy.arn
  role       = aws_iam_role.terraform-state-role.name
}