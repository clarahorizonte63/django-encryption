from django.conf import settings
from django import forms
from django.forms import ModelForm, TextInput, CheckboxInput, ModelChoiceField, DateInput, \
    Textarea, ChoiceField, Select, NumberInput,SlugField, HiddenInput
from django.forms import inlineformset_factory
from django.utils.translation import gettext_lazy

from common.forms import CustomBooleanField
from django.forms.models import modelformset_factory

from django.core.exceptions import ValidationError

from portal.models import Coworker, Shift, Team, CoworkerEncryption, ShiftEncryption,TeamEncryption

# ----------------------------------------------------------------------------------------------------------------------
# ---------------------- NOT Encrypted Forms -----------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

class form_team(ModelForm):
    class Meta:
        model = Team
        fields = '__all__'
        exclude = ['is_usable','timesheet_start_num']

    def __init__(self, exclude_list, readonly_list, fields_list, *args, **kwargs):
        super(form_team, self).__init__(*args, **kwargs)

        self.fields['name'].required = True

        self.fields['is_active'] = CustomBooleanField()
        self.fields['is_active'].label = gettext_lazy("A equipa está activa?")
        self.fields['is_active'].widget = CheckboxInput(attrs={'id': 'is_active', 'name': 'Is active?'})


        for readonly_field in readonly_list:
            self.fields[readonly_field].widget.attrs['disabled'] = 'disabled'
            self.fields[readonly_field].disabled = True
        for exclude_field in exclude_list:
            del self.fields[exclude_field]

        if fields_list is not None:
            self.fields = {field: self.fields[field] for field in fields_list if field in self.fields}



class form_coworker(ModelForm):
    class Meta:
        model = Coworker
        fields = '__all__'


        exclude = [ 'notes']
        #

    def __init__(self, exclude_list, readonly_list, fields_list, *args, **kwargs):
        super(form_coworker, self).__init__(*args, **kwargs)

        # self.fields['shift_type'] = gettext_lazy('Plano de trabalho')
        # self.fields['shift_alignment'] = gettext_lazy('Alinhamento')


        self.fields['team'] = ModelChoiceField(label=gettext_lazy("Equipa a que pertence"),
                                               help_text=gettext_lazy("Obrigatório. Se não selecionar equipa, este "
                                                                       "colaborador não será incluído na geração de "
                                                                       "escalas"),
                                               queryset=Team.objects.all().order_by(
                                                   'name'),
                                               to_field_name="id",
                                               empty_label=gettext_lazy('- select -'))




        for readonly_field in readonly_list:
            self.fields[readonly_field].widget.attrs['disabled'] = 'disabled'
            self.fields[readonly_field].disabled = True
        for exclude_field in exclude_list:
            del self.fields[exclude_field]

        if fields_list is not None:
            self.fields = {field: self.fields[field] for field in fields_list if field in self.fields}


class form_shift(ModelForm):
    class Meta:
        model = Shift
        fields = '__all__'
        exclude = []

    def __init__(self, *args, **kwargs):
        super(Shift, self).__init__(*args, **kwargs)



# ----------------------------------------------------------------------------------------------------------------------
# -------------------------------- Encrypted Forms  -----------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

class form_coworker_encpription(ModelForm):
    class Meta:
        model = CoworkerEncryption
        fields = '__all__'
        exclude = []

    def __init__(self, *args, **kwargs):
        super(form_coworker_encpription, self).__init__(*args, **kwargs)

class form_shift_encpription(ModelForm):
    class Meta:
        model = ShiftEncryption
        fields = '__all__'
        exclude = []

    def __init__(self, *args, **kwargs):
        super(form_shift_encpription, self).__init__(*args, **kwargs)

class form_team_encpription(ModelForm):
    class Meta:
        model = TeamEncryption
        fields = '__all__'
        exclude = []

    def __init__(self, *args, **kwargs):
        super(form_team_encpription, self).__init__(*args, **kwargs)
