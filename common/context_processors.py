from django.conf import settings


def globalsettings(request):
    # return any necessary values
    return {
        'GLOBAL_ENVIRONMENT': settings.GLOBAL_ENVIRONMENT,
        'GLOBAL_VERSION': settings.GLOBAL_VERSION,
        'GLOBAL_API_VERSION': settings.GLOBAL_API_VERSION,
        'GLOBAL_APP_NAME': settings.GLOBAL_APP_NAME,
        'GLOBAL_APP_TAG_LINE' : settings.GLOBAL_APP_TAG_LINE,
        'GLOBAL_APP_FAVICON': settings.GLOBAL_APP_FAVICON,
        'GLOBAL_APP_LOGO_LIGHT_FULL': settings.GLOBAL_APP_LOGO_LIGHT_FULL,
        'GLOBAL_APP_LOGO_SM': settings.GLOBAL_APP_LOGO_SM,
        'GLOBAL_APP_LOGO_DARK': settings.GLOBAL_APP_LOGO_DARK,
        'GLOBAL_URL': settings.GLOBAL_URL,
        'URL_SERVER': settings.URL_SERVER,
        'GLOBAL_DJANGO_PORT': settings.GLOBAL_DJANGO_PORT,
        'DATETIME_FORMAT': settings.DATETIME_FORMAT,
        'DATE_FORMAT': settings.DATE_FORMAT,
        'SHORT_DATE_FORMAT': settings.SHORT_DATE_FORMAT,
        'SHORT_DATETIME_FORMAT': settings.SHORT_DATETIME_FORMAT,
        'DATETIME_HTML_FORMAT': settings.DATETIME_HTML_FORMAT,
        'DATE_HTML_FORMAT': settings.DATE_HTML_FORMAT,
        'SHORT_DATE_HTML_FORMAT': settings.SHORT_DATE_HTML_FORMAT,
        'DATEPICKER_FORMAT': settings.DATEPICKER_FORMAT,
        'DATE_JS_FORMAT': settings.DATE_JS_FORMAT,
        'DATETIME_JS_FORMAT': settings.DATETIME_JS_FORMAT,
        'SESSION_EXPIRE_AT_BROWSER_CLOSE': settings.SESSION_EXPIRE_AT_BROWSER_CLOSE,
        'LANGUAGE_CODE': settings.LANGUAGE_CODE,
        'GLOBAL_BOARD_URL': settings.GLOBAL_BOARD_URL,
        'GLOBAL_WIKI_URL': settings.GLOBAL_WIKI_URL

    }