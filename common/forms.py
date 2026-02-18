from django.forms import BooleanField
from django.utils.translation import gettext_lazy
import six
from django.core.exceptions import ValidationError


class CustomBooleanField(BooleanField):
    # Django return display value and validate display value
    # this function return the hidden value of the select list and validate the hidden value
    def to_python(self, value):
        """Returns a Python boolean object."""
        # Explicitly check for the string 'False', which is what a hidden field
        # will submit for False. Also check for '0', since this is what
        # RadioSelect will provide. Because bool("True") == bool('1') == True,
        # we don't need to handle that explicitly.
        if isinstance(value, six.string_types) and value.lower() in ('false', '0'):
            value = False
        else:
            value = bool(value)
        if value:
            value = 'Y'
        else:
            value = 'N'
        return super(BooleanField, self).to_python(value)

    def validate(self, value):
        if not value and self.required:
            raise ValidationError(self.error_messages['required'], code='required')
