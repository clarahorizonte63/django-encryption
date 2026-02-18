from calendar import monthrange
from django import template
from datetime import date, timedelta, datetime
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from portal.models import Entity, Coworker, Team
from common.utils import *
from django.conf import settings
import pytz
from django.db.models import Sum
import re
from django.utils import timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db.models import Count

register = template.Library()


# check if values are None and returns a -
def cn(col):
    if col == None:
        return '-'
    else:
        return col

register.filter('cn', cn)