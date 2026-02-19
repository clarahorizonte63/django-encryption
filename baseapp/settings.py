# DJANGO SETTINGS ######################################################################################################


import os
from pathlib import Path
from decouple import config
import dj_database_url
import boto3
import base64
from django.core.exceptions import ImproperlyConfigured

import json
from urllib import request

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.realpath(os.path.dirname(__file__))

# ######################################################################################################################
# GLOBAL SETTINGS - These are used to define constants key values
# ######################################################################################################################
GLOBAL_ENVIRONMENT = config('GLOBAL_ENVIRONMENT','DEVELOPMENT')
GLOBAL_APP_NAME = config('GLOBAL_APP_NAME','HUB')
GLOBAL_APP_TAG_LINE = config('GLOBAL_APP_TAG_LINE','HUB')
GLOBAL_APP_FAVICON = config('GLOBAL_APP_FAVICON','favicon.png')
GLOBAL_APP_LOGO_LIGHT_FULL = config('GLOBAL_APP_LOGO_LIGHT_FULL','logo-light-full.png')
GLOBAL_APP_LOGO_SM = config('GLOBAL_APP_LOGO_SM','logo-sm.png')
GLOBAL_APP_LOGO_DARK = config('GLOBAL_APP_LOGO_DARK','logo-dark.png')
GLOBAL_VERSION = 'v2025.04.19'
GLOBAL_API_VERSION = 'v1'
GLOBAL_SITE_KEY = 'demo-secret-key-not-for-production'
URL_SERVER = config('URL_SERVER','http://127.0.0.1:8000')
GLOBAL_URL = URL_SERVER # DO NOT include a "/" at the end of the URL
GLOBAL_DJANGO_PORT = '80'

GLOBAL_BOARD_URL="#"
GLOBAL_WIKI_URL="#"

SECURE_CROSS_ORIGIN_OPENER_POLICY = None


DATETIME_FORMAT = 'Y-m-d H:m'
DATE_FORMAT = 'Y-m-d'
SHORT_DATE_FORMAT = '%Y%m%d'
SHORT_DATETIME_FORMAT = '%Y/%m/%d %H:%M'

DATETIME_HTML_FORMAT = 'Y-m-d H:i'
DATE_HTML_FORMAT = 'd-F-Y'
SHORT_DATE_HTML_FORMAT = 'Ymd'

DATEPICKER_FORMAT = '%Y-%m-%d'
DATE_JS_FORMAT = 'YYYY-MMM-DD'
DATETIME_JS_FORMAT = 'YYYY-MM-DD H:mm'


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'demo-secret-key-not-for-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

SECURE_SSL_REDIRECT = False
# for more security


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "django.contrib.auth",
    'django.contrib.humanize',
    'widget_tweaks',
    "corsheaders",
    'storages',
    'portal',
    'common',
    'rest_framework',
    'django_extensions'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]




SESSION_COOKIE_SECURE = False
SESSION_COOKIE_AGE = 1209600  # 2 weeks, adjust as needed
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'core.api.permissions.DenyAny',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',
    ),
}


ROOT_URLCONF = 'baseapp.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'portal/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'common.context_processors.globalsettings',
            ],
        },
    },
]

WSGI_APPLICATION = 'baseapp.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
#ADD YOUR DATABASE INFORMATION HERE
DATABASES = {}


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'pt-PT'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

CORS_ORIGIN_ALLOW_ALL = True


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
INTERNAL_IPS = [
    '127.0.0.1',
]


# Static files (CSS, JavaScript, Images) ###############################################################################

DEFAULT_FILE_STORAGE = 'common.storage_backends.MediaStorage'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


STATIC_ROOT = os.path.join(PROJECT_ROOT, 'staticfiles')
STATIC_URL = '/static/'
STATICFILES_DIRS = (
    os.path.join(PROJECT_ROOT, 'static'),
)

WRAPPED_KEYS =[

]




#HANDLE FERNET KEYS DECRYPTION FROM LOCAL STACK/AWS
FERNET_KEYS = []

region = 'eu-north-1'
localstack_endpoint = 'http://localhost:4566'
if WRAPPED_KEYS:
    try:
        kms = boto3.client('kms', region_name=region, endpoint_url=localstack_endpoint)

        unwrapped_keys =[]
        for wrapped_blob_b64 in WRAPPED_KEYS:
            #print(wrapped_blob_b64)
            # Decode from Base64 and unwrap via KMS
            wrapped_blob_bytes = base64.b64decode(wrapped_blob_b64)
            response = kms.decrypt(CiphertextBlob=wrapped_blob_bytes)

            # Fernet expects a URL-safe base64 encoded string
            plaintext_dek = response['Plaintext']
            fernet_compatible_key = base64.urlsafe_b64encode(plaintext_dek).decode('utf-8')
            unwrapped_keys.append(fernet_compatible_key)

    except Exception as e:
        # If decryption fails, the app cannot read its own database.
        # It is safer to crash on startup than to run with broken encryption.
        raise ImproperlyConfigured(f"KMS Decryption failed: {e}")
else:
    unwrapped_keys = []
FERNET_KEYS = unwrapped_keys + FERNET_KEYS

