import boto3
import base64

# Configuration
MK_ALIAS = 'alias/fernet-master-key'
region = 'eu-north-1'
localstack_endpoint = 'http://localhost:4566'

kms = boto3.client('kms', region_name=region, endpoint_url=localstack_endpoint)

# Generate the DEK
response = kms.generate_data_key(
    KeyId=MK_ALIAS,
    KeySpec='AES_256' # This gives us exactly 32 bytes, required for Fernet
)

plaintext_dek = base64.urlsafe_b64encode(response['Plaintext']).decode('utf-8')
wrapped_dek = base64.b64encode(response['CiphertextBlob']).decode('utf-8')
print(f"PLAINTEXT_DEK: {plaintext_dek}")
print(f"ENCRYPTED_DEK: {wrapped_dek}")