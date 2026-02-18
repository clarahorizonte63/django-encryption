import json
from django.conf import settings
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.http import JsonResponse
from django.urls import reverse_lazy, resolve
from django.shortcuts import redirect, render, get_object_or_404
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.core.mail import BadHeaderError
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.db import IntegrityError
from django.urls import resolve, reverse
from django.db.models import Sum, Q, Avg
import ast  # For safely evaluating Python-like strings
from datetime import date, datetime, timedelta
import random



@csrf_protect
def index(request):
    context = {}
    return render(request, 'portal_index.html', context)

