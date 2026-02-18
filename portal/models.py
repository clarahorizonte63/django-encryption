from django.db import models
import uuid

from django.utils import timezone
from fernet_fields import EncryptedCharField,EncryptedIntegerField,EncryptedDateField,EncryptedField
from imagekit.models import ProcessedImageField
from imagekit.processors import Transpose, SmartResize
from django.utils.translation import gettext_lazy as _

from common.utils import SHIFTTYPE, CONTRACTTYPE, DAYS, CIVIL_STATUS,COUNTRIES, RECRUITMENT_STAGES

def get_upload_path_entity(instance, filename):
    # print("Instance: ", instance.__class__.__name__.lower())
    return '{0}/{1}/{2}'.format(instance.__class__.__name__.lower(), instance.pk, filename)


# ----------------------------------------------------------------------------------------------------------------------
# ---------------------- Encrypted Decimal Field  --------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

class EncryptedDecimalField(EncryptedField, models.DecimalField):
    pass

# ----------------------------------------------------------------------------------------------------------------------
# ---------------------- NOT Encrypted Fields  -----------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

class Entity(models.Model):
    public_key_uuid = models.UUIDField(default=uuid.uuid4, editable=False, blank=True, null=True)

    name = models.CharField(verbose_name='Firma ou denominação da empresa', max_length=500, blank=True)
    location = models.CharField(verbose_name='Morada',
                                help_text='', max_length=300, blank=True)


    #district = models.CharField(verbose_name='Distrito', choices=DISTRICTS, default='Portugal', max_length=255, blank=True)
    country = models.CharField(verbose_name='País', choices=COUNTRIES,
                                default='PT', max_length=3, blank=True)

    # audit registo
    is_active = models.CharField(verbose_name='Entidade ativa?',
                                 help_text='',
                                 max_length=1, editable=False, blank=True, null=True, default="Y")
    created_on = models.DateTimeField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = models.CharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = models.DateTimeField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = models.CharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)
    deleted_on = models.DateTimeField(verbose_name='Date on which line was marked as deleted',
                                      editable=False, blank=True, null=True)

    class Meta:
        ordering = ['created_on']

    def __str__(self):
        return self.name


class Team(models.Model):
    public_key_uuid = models.UUIDField(default=uuid.uuid4, editable=False, blank=True, null=True)
    entity_related = models.ForeignKey(Entity, related_name="fk_team_entity_id", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)

    team_leader = models.ForeignKey('portal.Coworker', related_name="fk_team_coworker_id", on_delete=models.CASCADE,
                                     blank=True,
                                     null=True, editable=True)

    # technical_user = models.ForeignKey(User, related_name="fk_technical_user", on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(verbose_name='Nome da equipa', help_text='', max_length=100, blank=True)
    num_hours = models.DecimalField(verbose_name='Numero de horas que esta equipa faz diáriamente', default=24,
                                    max_digits=5,
                                    decimal_places=2, blank=True, null=True)
    customer = models.CharField(verbose_name='Cliente (Opcional)', help_text='', max_length=1000, blank=True)
    location = models.CharField(verbose_name='Localização (Opcional)', help_text='', max_length=1000, blank=True)
    desc = models.CharField(verbose_name='Descrição', help_text='', max_length=1000, blank=True)
    notes = models.TextField(verbose_name='Notas', help_text='', max_length=1000, blank=True)
    ignore_hours = models.CharField(verbose_name='Ignorar máximo legal de horas mensais?', help_text='Se SIM, todos os elementos desta equipa vão poder realizar mais do que 40 horas semanais', max_length=1, blank=True, null=True, default="N")
    is_active = models.CharField(verbose_name='Equipa ativa?', help_text='', max_length=1, blank=True, null=True, default="Y")
    is_usable = models.CharField(verbose_name='Para usar em testes',max_length=1, editable=False, blank=True, null=True, default='Y')
    is_deleted = models.CharField(verbose_name='Soft delete', max_length=1, editable=False, blank=True,
                                 null=True, default='N')

    # audit registo
    created_on = models.DateTimeField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = models.CharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = models.DateTimeField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = models.CharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)

    class Meta:
        ordering = ['name']

        indexes = [
            models.Index(fields=['entity_related', ]),
        ]

    def __str__(self):
        return self.name


class Coworker(models.Model):
    public_key_uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    entity_related = models.ForeignKey(Entity, related_name="fk_entity_id", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)


    # technical_user = models.ForeignKey(User, related_name="fk_technical_user", on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(verbose_name='Nome do colaborador', help_text='', max_length=500)
    cod = models.CharField(verbose_name='Código do Colaborador ou número mecanográfico', help_text='', max_length=255, null=True, blank=True)

    tax_number = models.IntegerField(verbose_name='NIF', default=0, blank=True, null=True)
    swift_pay = models.CharField(verbose_name='SWIFT Pagamento', max_length=15, null=True, blank=True)
    iban_pay = models.CharField(verbose_name='IBAN Pagamento', help_text='IBAN sem espaços. Exemplo: PT50123412341234123412345', max_length=35, null=True, blank=True)

    swift_receive = models.CharField(verbose_name='SWIFT Depósito', max_length=15, null=True, blank=True)
    iban_receive = models.CharField(verbose_name='IBAN Depósito', help_text='IBAN sem espaços. Exemplo: PT50123412341234123412345',
                            max_length=35, null=True, blank=True)


    notes = models.TextField(verbose_name='Notas',
                             help_text='Se pretender pode adicionar informações adicionais sobre este colaborador',
                             max_length=4000, blank=True)
    day1_shift = models.IntegerField(verbose_name='Turno pendente a aplicar no primeiro dia do mês', default=0,
                                     blank=True, null=False, editable=False)
    team = models.ForeignKey(Team, verbose_name='Equipa a que pertence', help_text='Não é obrigatório'
                             , related_name="fk_cw_team_id", on_delete=models.SET_NULL,
                             blank=True, null=True)

    # audit registo
    created_on = models.DateTimeField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = models.CharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = models.DateTimeField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = models.CharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)


    class Meta:
        ordering = ['name','created_on']
        indexes = [
            models.Index(fields=['entity_related', ]),
            models.Index(fields=['team', ]),
            models.Index(fields=['entity_related', 'team', ]),

        ]

    def __str__(self):
        return self.name


class Shift(models.Model):
    entity_related = models.ForeignKey(Entity, related_name="fk_shift_entity_id", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)

    cod = models.CharField(verbose_name='Código turno', help_text='Use apenas 3 letras', max_length=4,
                           blank=True)
    desc = models.CharField(verbose_name='Descrição', help_text='Nome do turno', max_length=100, blank=True)

    start_at = models.TimeField(verbose_name='Hora de arranque do turno',
                                   help_text='Coloque apenas a hora (exemplo: 08:00)', blank=True, null=True)
    end_at = models.TimeField(verbose_name='Hora de fim do turno', help_text='Coloque apenas a hora (exemplo: 16:00)', blank=True, null=True)

    is_reported = models.CharField(verbose_name='Este turno é apresentado nos relatórios?', editable=True, max_length=1,
                                   default="Y", blank=True,
                                   help_text="Se colocar como Não, os relatórios não irão apresentar o mesmo")

    # add shift to absence list
    is_absence = models.CharField(verbose_name='Este turno é uma ausência?', editable=True,
                                 max_length=1, null=True, blank=True, default="N")
    # audit registo
    created_on = models.DateTimeField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = models.CharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = models.DateTimeField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = models.CharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)

    class Meta:
        ordering = ['desc']
        indexes = [
            models.Index(fields=['entity_related', ]),
        ]

    def __str__(self):
        if self.is_absence == 'Y':
            return self.cod + ' | ' + self.desc
        else:
            return self.cod + ' (' + str(self.start_at) + ' - ' + str(self.end_at) + ') | ' + self.desc


# ----------------------------------------------------------------------------------------------------------------------
# ---------------------- Encrypted Fields  -----------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

class CoworkerEncryption(models.Model):
    public_key_uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    entity_related = models.ForeignKey(Entity, related_name="fk_entity_id_enc", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)


    # technical_user = models.ForeignKey(User, related_name="fk_technical_user", on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(verbose_name='Nome do colaborador', help_text='', max_length=500)
    cod = models.CharField(verbose_name='Código do Colaborador ou número mecanográfico', help_text='', max_length=255, null=True, blank=True)
    iban_pay = EncryptedCharField(verbose_name='IBAN Pagamento',
                                help_text='IBAN sem espaços. Exemplo: PT50123412341234123412345', max_length=35,
                                null=True, blank=True)

    nif = EncryptedCharField(verbose_name='Número de Contribuinte',
                                help_text='Número de Contribuinte. Exemplo: 256823212', max_length=10,
                                null=True, blank=True)

    team = models.ForeignKey(Team, verbose_name='Equipa a que pertence', help_text='Não é obrigatório'
                             , related_name="fk_cw_team_id_enc", on_delete=models.SET_NULL,
                             blank=True, null=True)


class ShiftEncryption(models.Model):
    entity_related = models.ForeignKey(Entity, related_name="fk_shift_encryption_entity_id", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)
    cod = EncryptedCharField(verbose_name='Código turno', help_text='Use apenas 3 letras', max_length=4,
                           blank=True)
    desc = EncryptedCharField(verbose_name='Descrição', help_text='Nome do turno', max_length=100, blank=True)

    start_at = models.TimeField(verbose_name='Hora de arranque do turno',
                                   help_text='Coloque apenas a hora (exemplo: 08:00)', blank=True, null=True)
    end_at = models.TimeField(verbose_name='Hora de fim do turno', help_text='Coloque apenas a hora (exemplo: 16:00)', blank=True, null=True)

    is_reported = models.CharField(verbose_name='Este turno é apresentado nos relatórios?', editable=True, max_length=1,
                                    default="Y", blank=True,
                                    help_text="Se colocar como Não, os relatórios não irão apresentar o mesmo")

    # add shift to absence list
    is_absence = models.CharField(verbose_name='Este turno é uma ausência?', editable=True,
                                 max_length=1, null=True, blank=True, default="N")

    # audit registo
    created_on = EncryptedDateField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = EncryptedCharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = EncryptedDateField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = EncryptedCharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)

    class Meta:
        ordering = ['desc']
        indexes = [
            models.Index(fields=['entity_related', ]),
        ]

class TeamEncryption(models.Model):
    public_key_uuid = models.UUIDField(default=uuid.uuid4, editable=False, blank=True, null=True)
    entity_related = models.ForeignKey(Entity, related_name="fk_team_encryption_entity_id", on_delete=models.CASCADE, blank=True,
                                       null=True, editable=False)

    team_leader = models.ForeignKey('portal.Coworker', related_name="fk_team_encryption_coworker_id", on_delete=models.CASCADE,
                                     blank=True,
                                     null=True, editable=True)

    # technical_user = models.ForeignKey(User, related_name="fk_technical_user", on_delete=models.CASCADE, blank=True, null=True)
    name = EncryptedCharField(verbose_name='Nome da equipa', help_text='', max_length=100, blank=True)
    desc = EncryptedCharField(verbose_name='Descrição', help_text='', max_length=1000, blank=True)
    notes = models.TextField(verbose_name='Notas', help_text='', max_length=1000, blank=True)
    num_hours = EncryptedDecimalField(verbose_name='Numero de horas que esta equipa faz diáriamente', default=24,
                                      max_digits=5,
                                      decimal_places=2, blank=True, null=True)

    customer = models.CharField(verbose_name='Cliente (Opcional)', help_text='', max_length=1000, blank=True)
    location = models.CharField(verbose_name='Localização (Opcional)', help_text='', max_length=1000, blank=True)
    ignore_hours = models.CharField(verbose_name='Ignorar máximo legal de horas mensais?', help_text='Se SIM, todos os elementos desta equipa vão poder realizar mais do que 40 horas semanais', max_length=1, blank=True, null=True, default="N")
    is_active = EncryptedCharField(verbose_name='Equipa ativa?', help_text='', max_length=1, blank=True, null=True, default="Y")
    is_usable = models.CharField(verbose_name='Para usar em testes',max_length=1, editable=False, blank=True, null=True, default='Y')
    is_deleted = models.CharField(verbose_name='Soft delete', max_length=1, editable=False, blank=True,
                                 null=True, default='N')

    # audit registo
    created_on = models.DateTimeField(verbose_name='Date on which line was created', auto_now_add=True,
                                      editable=False, blank=True, null=True)
    created_by = models.CharField(verbose_name='User who created the line', max_length=255, editable=False, blank=True,
                                  null=True)
    updated_on = models.DateTimeField(verbose_name='Latest date on whiich line was updated', auto_now=True,
                                      editable=False, blank=True, null=True)
    updated_by = models.CharField(verbose_name='Latest user who updated the line', max_length=255, editable=False,
                                  blank=True, null=True)

    class Meta:
        ordering = ['name']

        indexes = [
            models.Index(fields=['entity_related', ]),
        ]


