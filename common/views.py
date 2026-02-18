from django.shortcuts import render

# Create your views here.
from django.contrib.auth import authenticate, login
from django.utils import timezone
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.utils.translation import gettext_lazy
from django.utils.cache import add_never_cache_headers
from django.http.response import Http404
from django.contrib import messages
from django.contrib.auth import authenticate, login as dj_login, logout as dj_logout
from django.core.mail import EmailMultiAlternatives, EmailMessage
from django.template.loader import get_template
from django.views.decorators.cache import never_cache
from datetime import date, datetime, timedelta
from baseapp import settings

import django.conf.urls.i18n
from django.utils.crypto import get_random_string

from django.middleware.locale import LocaleMiddleware
import uuid
from django.conf import settings
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
