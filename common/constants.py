from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator

c_regex_codes = RegexValidator(r'^[0-9a-zA-Z_-]*$', _('Only alphanumeric characters are allowed.'))
