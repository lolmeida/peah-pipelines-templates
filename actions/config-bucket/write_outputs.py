import os


class TextColors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    RESET = "\033[0m"


def github(outputs):
    print("Writing outputs ...")
    with open(os.environ["GITHUB_OUTPUT"], "a") as file:
        for key, value in outputs.items():
            file.write(f"{key}={value}\n")
            print(key + " -> " + str(value))


def info(msg):
    print(msg)


def success(msg):
    print(f"{TextColors.GREEN}{msg}{TextColors.RESET}")


def warnning(msg):
    print(f"{TextColors.YELLOW}{msg}{TextColors.RESET}")


def error(msg):
    print(f"{TextColors.RED}{msg}{TextColors.RESET}")
