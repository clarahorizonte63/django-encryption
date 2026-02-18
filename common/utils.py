from django.utils.translation import gettext_lazy as _



SHIFTTYPE = (
    #("PERMANENTE", "PERMANENTE"),
    #("SEMANAL PROLONGADO", "SEMANAL PROLONGADO"),
    ("SEMANAL", "SEMANAL"),
    ("TOTAL", "TOTAL"),
    #("PARCIAL", "PARCIAL"),

)

CONTRACTTYPE = (
    ("TERMO", "TERMO"),
    ("INDETERMINADO", "INDETERMINADO"),
    ("SERVICOS", "SERVICOS"),

)

DAYS = (
    ("-", "-"),
    ("SEGUNDA", "SEGUNDA"),
    ("TERÇA", "TERÇA"),
    ("QUARTA", "QUARTA"),
    ("QUINTA", "QUINTA"),
    ("SEXTA", "SEXTA"),
    ("SABADO", "SABADO"),
    ("DOMINGO", "DOMINGO"),
)

CIVIL_STATUS = (
    ('Solteiro', 'Solteiro'),
    ('Casado', 'Casado'),
    ('União  de facto', 'União  de facto'),
    ('Divorciado', 'Divorciado'),
    ('VIUVO','VIUVO'),
    ('Não especificado', 'Não especificado')
)

# Recruitment stage choices
RECRUITMENT_STAGES = [
    ('NEW', _('New Candidate')),
    ('INTERVIEW', _('Interview Scheduled')),
    ('ASSESSMENT', _('Assessment Sent')),
    ('OFFER', _('Offer Made')),
    ('HIRED', _('Hired')),
    ('REJECTED', _('Rejected'))
]

COUNTRIES = (
    ('PT', _('Portugal')),
    ('ES', _('España')),
    ('BR', _('Brazil')),
    ('FR', _('France')),
    ('XX', _('Outro')),
)