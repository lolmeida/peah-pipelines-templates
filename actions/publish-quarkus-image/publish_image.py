import argparse
import subprocess
import json
import sys


def call(aws_region, tags, tag_latest, immutable_tags, **kwargs):

    if "latest" in tags:
        raise Exception(
            'latest tag should not be specified. Set "tag_latest" variable as true'
        )

    if not kwargs["repository"] and immutable_tags:
        raise Exception(
            "repository must be defined or immutable_tags must be set to false"
        )

    if immutable_tags:
        result = subprocess.run(
            f"aws ecr list-images --repository {kwargs['repository']} --region {aws_region}",
            stdout=subprocess.PIPE,
            text=True,
            shell=True,
        )
        output = result.stdout
        json_data = json.loads(output)
        existent_tags = [image["imageTag"] for image in json_data.get("imageIds", [])]

    else:
        existent_tags = []

    if immutable_tags and set(tags).intersection(existent_tags):
        print("Image build skipped, because tags already exist")
        sys.exit(0)

    else:
        if tag_latest:
            if immutable_tags:
                subprocess.run(
                    f"aws ecr batch-delete-image --repository-name {kwargs['repository']} --region ${aws_region} --image-ids imageTag=latest",
                    shell=True,
                )
            tags.append("latest")

    mvn_cmd = f"./mvnw clean package -Dcheckstyle.skip -Dmaven.test.skip -Dmaven.compiler.skip=true -Dquarkus.container-image.push=true -Dquarkus.container-image.tag={tags[0]}"

    if len(tags) > 1:
        mvn_cmd += f" -Dquarkus.container-image.additional-tags={','.join(tags[1:])}"

    if kwargs["registry"]:
        mvn_cmd += f" -Dquarkus.container-image.registry={kwargs['registry']}"

    if kwargs["repository"]:
        mvn_cmd += f" -Dquarkus.container-image.name={kwargs['repository']}"

    print(mvn_cmd)
    subprocess.run(mvn_cmd, shell=True, check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--aws-region", type=str, required=True)
    parser.add_argument("--tags", nargs="+", type=str, required=True)
    parser.add_argument("--tag-latest", action="store_true", default=False)
    parser.add_argument("--repository", type=str, required=False)
    parser.add_argument("--registry", type=str, required=False)
    parser.add_argument("--immutable-tags", action="store_true", default="True")

    args = parser.parse_args()

    call(
        args.aws_region,
        args.tags,
        args.tag_latest,
        args.immutable_tags,
        repository=args.repository,
        registry=args.registry
    )


if __name__ == "__main__":
    main()
