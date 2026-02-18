import numpy as np
import pandas as pd
import django
import os
import uuid
import random
from faker import Faker
from decimal import Decimal
from datetime import time,timedelta,datetime
from django.forms.models import model_to_dict

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'baseapp.settings')
django.setup()

from portal.models import Entity,Coworker, CoworkerEncryption, Shift, ShiftEncryption, Team, TeamEncryption
fake = Faker("pt_PT")


def random_iban():
    return "PT50" + "".join(str(random.randint(0, 9)) for _ in range(21))


def random_swift():
    return fake.swift(length=11)


def import_customers_encription(entity, n, batch_size=500, created_by="system"):
    #CoworkerEncryption.objects.all().delete()
    #df = pd.DataFrame(columns=["name","cod","entity_related_id","iban_pay","nif"])
    coworkers_plain = []
    coworkers_encrypted = []

    for _ in range(n):
        # generate ONCE
        pk_uuid = uuid.uuid4()
        name = fake.name()
        cod = str(fake.random_number(digits=6))
        tax_number = fake.random_int(100000000, 299999999)
        swift_pay = random_swift()
        iban_pay = random_iban()
        swift_receive = random_swift()
        iban_receive = random_iban()
        notes = fake.text(max_nb_chars=300)
        day1_shift = random.randint(0, 3)

        coworkers_plain.append(
            Coworker(
                public_key_uuid=pk_uuid,
                entity_related=entity,
                name=name,
                cod=cod,
                tax_number=tax_number,
                swift_pay=swift_pay,
                iban_pay=iban_pay,
                swift_receive=swift_receive,
                iban_receive=iban_receive,
                notes=notes,
                day1_shift=day1_shift,
                created_by=created_by,
            )
        )

        coworkers_encrypted.append(
            CoworkerEncryption(
                public_key_uuid=pk_uuid,
                entity_related=entity,
                name=name,
                cod=cod,
                nif=swift_pay,
                iban_pay=iban_pay,
            )
        )

    #Coworker.objects.bulk_create(coworkers_plain, batch_size=batch_size)
    CoworkerEncryption.objects.bulk_create(coworkers_encrypted, batch_size=batch_size)

def import_shift_encryption(entity, n, batch_size=500, created_by="system"):
    #ShiftEncryption.objects.all().delete()
    #return 0

    shifts_plain = []
    shifts_encrypted = []

    for _ in range(n):
        # generate ONCE
        cod = str(fake.random_number(digits=6))
        desc = fake.sentence()

        # Generate random start time (hour between 0 and 20)
        start_hour = random.randint(0, 20)
        start_minute = random.choice([0, 15, 30, 45])
        start_at = time(hour=start_hour, minute=start_minute)

        # Generate random duration (4 to 10 hours)
        duration_hours = random.randint(4, 10)
        end_datetime = (
                datetime.combine(datetime.today(), start_at) +
                timedelta(hours=duration_hours)
        )
        end_at = end_datetime.time()

        is_reported = random.choice(["Y", "N"])
        is_absence = random.choice(["Y", "N"])

        shifts_plain.append(
                Shift(
                    entity_related=entity,
                    cod=cod,
                    desc=desc,
                    start_at=start_at,
                    end_at=end_at,
                    is_reported=is_reported,
                    is_absence=is_absence,
                    created_by=created_by,
                    updated_by=created_by,
                )
            )

        shifts_encrypted.append(
            ShiftEncryption(
                entity_related=entity,
                cod=cod,
                desc=desc,
                start_at=start_at,
                end_at=end_at,
                is_reported=is_reported,
                is_absence=is_absence,
                created_by=created_by,
                updated_by=created_by,
            )
        )

    #Shift.objects.bulk_create(shifts_plain, batch_size=batch_size)
    ShiftEncryption.objects.bulk_create(shifts_encrypted, batch_size=batch_size)



def import_team_encryption(entity, n, batch_size=500, created_by="system"):
    #TeamEncryption.objects.all().delete()
    #return 0

    teams_plain = []
    teams_encrypted = []

    for i in range(n):
        # generate ONCE
        name = f"Equipa {fake.word().capitalize()} {i}"
        num_hours = Decimal(random.choice([8, 12, 24]))
        desc = fake.sentence()
        notes = fake.text(max_nb_chars=200)
        ignore_hours = random.choice(["Y", "N"])

        teams_plain.append(
            Team(
                entity_related=entity,
                name=name,
                num_hours=num_hours,
                desc=desc,
                notes=notes,
                ignore_hours=ignore_hours,
                is_active="Y",
                is_usable="Y",
                is_deleted="N",
                created_by=created_by,
            )
        )

        teams_encrypted.append(
            TeamEncryption(
                entity_related=entity,
                name=name,
                num_hours=num_hours,
                desc=desc,
                notes=notes,
                ignore_hours=ignore_hours,
                is_active="Y",
                is_usable="Y",
                is_deleted="N",
                created_by=created_by,
            )
        )
    #Team.objects.bulk_create(teams_plain, batch_size=batch_size)
    TeamEncryption.objects.bulk_create(teams_encrypted, batch_size=batch_size)

if __name__ == "__main__":
    entity = Entity.objects.filter(name="valuedate.io").first()

    #import_customers_encription(entity, 10000)
    import_shift_encryption(entity, 10)
    #import_team_encryption(entity, 10000)