import argparse
import json
import base64
from datetime import datetime, timedelta

from jwcrypto import jwk, jwt


def decode_jwk_token(jwk_token):
    # Decode the Base64-encoded JWK token
    decoded_token = base64.b64decode(jwk_token)

    # Parse the JSON content
    jwk_json = json.loads(decoded_token)

    return jwk_json


def generate_jwt(key: str, subject: str, ttl: int, groups: str):
    current_date = datetime.now()

    expiration_date = current_date + timedelta(seconds=ttl)

    jwt_payload = {
        "sub": subject,
        "exp": expiration_date.timestamp(),
        "groups": groups.split(",")
    }

    jwk_json = decode_jwk_token(key)

    key_id = jwk_json["kid"]

    jwt_header = {
        "kid": key_id,
        "alg": "RS256"
    }

    private_rsa_key = jwk.JWK(**jwk_json)

    token = jwt.JWT(header=jwt_header, claims=jwt_payload)
    token.make_signed_token(private_rsa_key)
    signed_jwt = token.serialize()

    print(signed_jwt)


def main():
    parser = argparse.ArgumentParser(description="Generate a JSON Web Token (JWT).")
    parser.add_argument("-k", "--key", help="The Private RSA Key.")
    parser.add_argument("-s", "--subject", help="The subject for the JWT.")
    parser.add_argument("-t", "--ttl", help="Token validity time.", type=int)
    parser.add_argument("-g", "--groups", help="The groups for the JWT.")

    args = parser.parse_args()

    generate_jwt(args.key, args.subject, args.ttl, args.groups)


if __name__ == '__main__':
    main()
