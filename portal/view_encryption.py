import os

from django.shortcuts import redirect, render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.crypto import get_random_string
from django.http import HttpResponseRedirect
import requests
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import IntegrityError, connection
from django.utils import timezone

from portal.models import Entity, Coworker, Shift, Team, CoworkerEncryption, ShiftEncryption, TeamEncryption
from portal.forms import form_coworker_encpription,form_shift_encpription, form_team_encpription
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import time
import pandas as pd


def calc_stats_df(df,output_csv):
    #print(df)
    group_cols = ['Table', 'Num Vars', 'Num Encrypted Vars', 'Encrypted fields', 'Rows']
    results = df.groupby(group_cols)['Time(ms)'].agg(['mean', 'std', 'max', 'min']).reset_index()
    results.columns = group_cols + ['Mean_Time', 'Std_Time', 'Max_Time', 'Min_Time']

    # Display the results
    #print(results)
    file_exists = os.path.isfile(output_csv)
    results.to_csv(output_csv, mode='a', index=False, header=not file_exists)



def portal_coworker_encryption(request):
    l_info_log = ''
    l_comp_name_log = 'coworker_encryption'
    l_comp_attr_log = '%s.portal_coworker_encryption' % __name__
    fields = [field.name for field in CoworkerEncryption._meta.fields]
    context = {"model_fields": fields}
    return render(request, 'portal_coworker_encryption.html', context)

@require_POST
@csrf_exempt  # use only if you're not sending CSRF token
def test_coworker_encryption(request):
    runs = int(request.POST.get("runs"))
    limit = int(request.POST.get("limit"))
    selected_field = request.POST.get("field")
    print(runs, limit, selected_field)

    timings = []
    run_lst = []

    querry_type = selected_field if selected_field else "coworker"

    #Pick fields to be saved in the csv
    name = selected_field if selected_field else "Coworker"
    fields = selected_field if selected_field else "IBAN-NIF"
    vars_total = "1" if selected_field else "5"
    vars_encrypted = "1" if selected_field else "2"


    #static_variables = [f"{name} Encryption", vars_total, vars_encrypted, fields, str(limit)]
    static_variables = [f"{name}", "0", "-", fields,str(limit)]


    for i in range(runs + 1):
        start = time.perf_counter()
        if selected_field:
            #records = CoworkerEncryption.objects.only(selected_field).order_by('-id')[:limit]
            records = Coworker.objects.only(selected_field).order_by('-id')[:limit]
        else:
            # records = CoworkerEncryption.objects.only("name", "cod", "entity_related_id", "iban_pay", "nif").order_by('-id')[:limit]
            records = Coworker.objects.only("name", "cod", "entity_related_id", "iban_pay", "swift_pay").order_by('-id')[:limit]
        records = records.union(records, all=True)
        list(records.iterator())
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"Elapsed: {elapsed_ms:.3f} ms")


        if i > 0:
            row_values = static_variables + [i-1,elapsed_ms]
            run_lst.append(row_values)
            timings.append(elapsed_ms)

    #Aid to see what was searched
    paginator = Paginator(records, min(limit, 100))
    page_obj = paginator.page(1)

    if selected_field:
        records = list(page_obj.object_list.values(selected_field))
    else:
        records = list(
            page_obj.object_list.values(
                "id", "name", "cod", "entity_related_id", "iban_pay", "swift_pay"
            )
        )

    data_dir = f"data/{querry_type}/"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    run_df = pd.DataFrame(run_lst,
                          columns=['Table', 'Num Vars', 'Num Encrypted Vars', 'Encrypted fields', 'Rows', 'Run Id', 'Time(ms)'])
    filename = data_dir + "_".join(static_variables) + "_runs.csv"
    run_df.to_csv(filename, index=False)

    stat_dir = f"data/{querry_type}/stats/"
    if not os.path.exists(stat_dir):
        os.makedirs(stat_dir)
    stats_csv = stat_dir + f"{querry_type}_stats.csv"
    calc_stats_df(run_df, stats_csv)

    stats = {
        "runs": len(timings),
        "min": round(min(timings), 3),
        "max": round(max(timings), 3),
        "avg": round(sum(timings) / len(timings), 3),
        "records": records,
        "selected_field": selected_field,
    }

    return JsonResponse(stats)



# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Add ------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------


def portal_coworker_encryption_add(request):
    l_info_log = ''
    l_comp_name_log = 'Add a Coworker Encryption'
    l_comp_attr_log = '%s.portal_bookmark_add' % __name__
    #print(request.user.get_entity_id())
    try:

        exclude_list = []
        readonly_list = []

        if request.method == 'POST':
            form = form_coworker_encpription(request.POST, request.FILES)
        else:
            form = form_coworker_encpription()

        if form.is_valid():
            l_model = form.save(commit=False)
            l_model.user_id = request.user.id
            #l_model.entity_related_id = request.user.get_entity_id()
            l_model.created_by = request.user.email
            l_model.save()

            messages.success(request, 'Coworker Encryption adicionado')
            return redirect('/coworkerencryption')

        context = {'form': form}
        return render(request, 'portal_coworker_encryption_edit.html', context)

    except IntegrityError as e:
        context = {'form': form, 'message': e.__cause__}
        return render(request, 'portal_coworker_encryption_edit.html', context)

    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ---------------------------------------------  Edit ------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_coworker_encryption_edit(request, p_id):
    l_info_log = 'p_id=>%s' % p_id
    l_comp_name_log = 'Edit Work template Info'
    l_comp_attr_log = '%s.portal_bookmark_edit' % __name__

    try:
        l_content = get_object_or_404(CoworkerEncryption, pk=p_id)



        readonly_list = []
        exclude_list = []

        if request.method == 'POST':
            form = form_coworker_encpription(request.POST or None, request.FILES, instance=l_content)

        else:
            form = form_coworker_encpription(request.POST or None, instance=l_content)


        if form.is_valid():
            l_model = form.save(commit=False)
            l_model.user_id = request.user.id
            l_model.entity_related_id = request.user.get_entity_id()
            l_model.updated_by = request.user.email
            l_model.save()

            messages.success(request, 'Coworker Encryption atualizada com sucesso')

            return redirect('/coworkerencryption')
        context = {
            'form': form, 'p_id': p_id, 'l_content': l_content,

        }

        return render(request, 'portal_coworker_encryption_edit.html', context)

    except IntegrityError as e:
        context = {
            'form': form, 'p_id': p_id,
            'l_content': l_content,

            'message': e.__cause__}
        return render(request, 'portal_coworker_encryption_edit.html', context)
    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Delete ---------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_coworker_encryption_delete(request, p_id):
    try:
        l_content = get_object_or_404(CoworkerEncryption, pk=p_id)

        CoworkerEncryption.objects.get(pk=int(p_id)).delete()
        messages.warning(request, 'Coworker Encryption removido')
        return redirect('/coworkerencryption')

    except:
        return render(request, '500.html')



##################################  Shift  ######################################


def portal_shift_encryption(request):
    l_info_log = ''
    l_comp_name_log = 'shift_encryption'
    l_comp_attr_log = '%s.portal_shift_encryption' % __name__

    fields = [field.name for field in ShiftEncryption._meta.fields]
    context = {"model_fields": fields}

    return render(request, 'portal_shift_encryption.html', context)


@require_POST
@csrf_exempt  # use only if you're not sending CSRF token
def test_shift_encryption(request):
    runs = int(request.POST.get("runs"))
    limit = int(request.POST.get("limit"))
    selected_field = request.POST.get("field")
    print(runs, limit, selected_field)

    timings = []
    run_lst = []

    querry_type = selected_field if selected_field else "shift"

    #Pick fields to be saved in the csv
    name = selected_field if selected_field else "Shift"
    fields = selected_field if selected_field else "Cod-Desc-Created_By-Created_On-Updated_By-Updated_On"
    vars_total = "1" if selected_field else "10"
    vars_encrypted = "1" if selected_field else "6"


    #static_variables = [f"{name} Encryption", vars_total, vars_encrypted, fields, str(limit)]
    static_variables = [f"{name}", "0", "-", fields,str(limit)]


    for i in range(runs + 1):
        start = time.perf_counter()
        if selected_field:
            #records = ShiftEncryption.objects.only(selected_field).order_by('-id')[:limit]

            records = Shift.objects.only(selected_field).order_by('-id')[:limit]
        else:
            #records = ShiftEncryption.objects.only("cod","desc","start_at","end_at","is_absence","entity_related_id","created_on","created_by","updated_on","updated_by").order_by('-id')[:limit]
            records = Shift.objects.only("cod","desc","start_at","end_at","is_absence","entity_related_id","created_on","created_by","updated_on","updated_by").order_by('-id')[:limit]

        records = records.union(records, all=True)
        list(records.iterator())
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"Elapsed: {elapsed_ms:.3f} ms")


        if i > 0:
            row_values = static_variables + [i-1,elapsed_ms]
            run_lst.append(row_values)
            timings.append(elapsed_ms)

    #Aid to see what was searched
    paginator = Paginator(records, min(limit, 100))
    page_obj = paginator.page(1)

    if selected_field:
        records = list(page_obj.object_list.values(selected_field))
    else:
        records = list(
            page_obj.object_list.values(
                "cod","desc","start_at","end_at","is_absence","entity_related_id","created_on","created_by","updated_on","updated_by"
            )
        )

    data_dir = f"data/{querry_type}/"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    run_df = pd.DataFrame(run_lst,
                          columns=['Table', 'Num Vars', 'Num Encrypted Vars', 'Encrypted fields', 'Rows', 'Run Id', 'Time(ms)'])
    filename = data_dir + "_".join(static_variables) + "_runs.csv"
    #run_df.to_csv(filename, index=False)

    stat_dir = f"data/{querry_type}/stats/"
    if not os.path.exists(stat_dir):
        os.makedirs(stat_dir)
    stats_csv = stat_dir + f"{querry_type}_stats.csv"
    #calc_stats_df(run_df, stats_csv)

    stats = {
        "runs": len(timings),
        "min": round(min(timings), 3),
        "max": round(max(timings), 3),
        "avg": round(sum(timings) / len(timings), 3),
        "records": records,
        "selected_field": selected_field,
    }

    return JsonResponse(stats)


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Add ------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------


def portal_shift_encryption_add(request):
    l_info_log = ''
    l_comp_name_log = 'Add a Shift Encryption'
    l_comp_attr_log = '%s.portal_bookmark_add' % __name__
    print(request.user.get_entity_id())
    try:

        exclude_list = []
        readonly_list = []

        if request.method == 'POST':
            form = form_shift_encpription(request.POST, request.FILES)


        else:
            form = form_shift_encpription()

        if form.is_valid():
            l_model = form.save(commit=False)
            l_model.user_id = request.user.id
            l_model.entity_related_id = request.user.get_entity_id()
            l_model.created_by = request.user.email
            l_model.save()

            messages.success(request, 'Shift Encryption adicionado')
            return redirect('/shiftencryption')

        context = {'form': form}
        return render(request, 'portal_shift_encryption_edit.html', context)

    except IntegrityError as e:
        context = {'form': form, 'message': e.__cause__}
        return render(request, 'portal_shift_encryption_edit.html', context)

    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ---------------------------------------------  Edit ------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_shift_encryption_edit(request, p_id):
    l_info_log = 'p_id=>%s' % p_id
    l_comp_name_log = 'Edit Work template Info'
    l_comp_attr_log = '%s.portal_bookmark_edit' % __name__

    try:

        l_content = get_object_or_404(ShiftEncryption, pk=p_id)

        if l_content.entity_related_id == request.user.get_entity_id() or True:

            readonly_list = []
            exclude_list = []

            if request.method == 'POST':
                form = form_shift_encpription(request.POST or None, request.FILES, instance=l_content)

            else:
                form = form_shift_encpription(request.POST or None, instance=l_content)


            if form.is_valid():
                l_model = form.save(commit=False)
                l_model.user_id = request.user.id
                l_model.entity_related_id = request.user.get_entity_id()
                l_model.updated_by = request.user.email
                l_model.save()

                messages.success(request, 'Shift Encryption atualizada com sucesso')

                return redirect('/shiftencryption')
            context = {
                'form': form, 'p_id': p_id, 'l_content': l_content,

            }

            return render(request, 'portal_shift_encryption_edit.html', context)
        else:
            return render(request, '403.html')

    except IntegrityError as e:
        context = {
            'form': form, 'p_id': p_id,
            'l_content': l_content,

            'message': e.__cause__}
        return render(request, 'portal_shift_encryption_edit.html', context)
    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Delete ---------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_shift_encryption_delete(request, p_id):
    try:

        l_content = get_object_or_404(ShiftEncryption, pk=p_id)


        if l_content.entity_related_id == request.user.get_entity_id() or True:
            ShiftEncryption.objects.get(pk=int(p_id)).delete()
            messages.warning(request, 'Shift Encryption removido')
            return redirect('/shiftencryption')

        else:
            return render(request, '403.html')
    except:
        return render(request, '500.html')


##################################  Team  ######################################


def portal_team_encryption(request):
    l_info_log = ''
    l_comp_name_log = 'team_encryption'
    l_comp_attr_log = '%s.portal_team_encryption' % __name__

    fields = [field.name for field in TeamEncryption._meta.fields]
    context = {"model_fields": fields}

    return render(request, 'portal_team_encryption.html', context)

@require_POST
@csrf_exempt  # use only if you're not sending CSRF token
def test_team_encryption(request):
    runs = int(request.POST.get("runs"))
    limit = int(request.POST.get("limit"))
    selected_field = request.POST.get("field")
    print(runs, limit,selected_field)

    timings = []
    run_lst = []

    querry_type = selected_field  if selected_field else "team"

    #Pick fields to be saved in the csv
    name = selected_field  if selected_field else "Team"
    fields = selected_field if selected_field else "Name-Desc-Num_Hours-Is_Active"
    vars_total = "1" if selected_field else "4"
    vars_encrypted = "1" if selected_field else "4"


    #static_variables = [f"{name} Encryption", vars_total, vars_encrypted, fields, str(limit)]
    static_variables = [f"{name}", "0", "-", fields,str(limit)]


    for i in range(runs + 1):
        start = time.perf_counter()
        if selected_field:
            #records = TeamEncryption.objects.only(selected_field).order_by('-id')[:limit]
            records = Team.objects.only(selected_field).order_by('-id')[:limit]
        else:
            records = TeamEncryption.objects.only("name", "desc", "num_hours", "is_active").order_by('-id')[:limit]
            #records = Team.objects.only("name", "desc", "num_hours", "is_active").order_by('-id')[:limit]

        #records = records.union(records, all=True)
        list(records.iterator())
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"Elapsed: {elapsed_ms:.3f} ms")


        if i > 0:
            row_values = static_variables + [i-1,elapsed_ms]
            run_lst.append(row_values)
            timings.append(elapsed_ms)

    #Aid to see what was searched
    paginator = Paginator(records, min(limit, 100))
    page_obj = paginator.page(1)

    if selected_field:
        records = list(page_obj.object_list.values(selected_field))
    else:
        records = list(
            page_obj.object_list.values(
                "name", "desc", "num_hours", "is_active"
            )
        )

    data_dir = f"data/{querry_type}/"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    run_df = pd.DataFrame(run_lst,
                          columns=['Table', 'Num Vars', 'Num Encrypted Vars', 'Encrypted fields', 'Rows', 'Run Id', 'Time(ms)'])
    filename = data_dir + "_".join(static_variables) + "_runs.csv"
    run_df.to_csv(filename, index=False)

    stat_dir = f"data/{querry_type}/stats/"
    if not os.path.exists(stat_dir):
        os.makedirs(stat_dir)
    stats_csv = stat_dir + f"{querry_type}_stats.csv"
    calc_stats_df(run_df, stats_csv)

    stats = {
        "runs": len(timings),
        "min": round(min(timings), 3),
        "max": round(max(timings), 3),
        "avg": round(sum(timings) / len(timings), 3),
        "records": records,
        "selected_field": selected_field,
    }

    return JsonResponse(stats)



# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Add ------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------


def portal_team_encryption_add(request):
    l_info_log = ''
    l_comp_name_log = 'Add a Team Encryption'
    l_comp_attr_log = '%s.portal_bookmark_add' % __name__
    print(request.user.get_entity_id())
    try:

        exclude_list = []
        readonly_list = []

        if request.method == 'POST':
            form = form_team_encpription(request.POST, request.FILES)
        else:
            form = form_team_encpription()

        if form.is_valid():
            l_model = form.save(commit=False)
            l_model.user_id = request.user.id
            l_model.entity_related_id = request.user.get_entity_id()
            l_model.created_by = request.user.email
            l_model.save()

            messages.success(request, 'Team Encryption adicionado')
            return redirect('/teamencryption')

        context = {'form': form}
        return render(request, 'portal_team_encryption_edit.html', context)

    except IntegrityError as e:
        context = {'form': form, 'message': e.__cause__}
        return render(request, 'portal_team_encryption_edit.html', context)

    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ---------------------------------------------  Edit ------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_team_encryption_edit(request, p_id):
    l_info_log = 'p_id=>%s' % p_id
    l_comp_name_log = 'Edit Work template Info'
    l_comp_attr_log = '%s.portal_bookmark_edit' % __name__

    try:

        l_content = get_object_or_404(TeamEncryption, pk=p_id)

        if l_content.entity_related_id == request.user.get_entity_id() or True:

            readonly_list = []
            exclude_list = []

            if request.method == 'POST':
                form = form_team_encpription(request.POST or None, request.FILES, instance=l_content)

            else:
                form = form_team_encpription(request.POST or None, instance=l_content)


            if form.is_valid():
                l_model = form.save(commit=False)
                l_model.user_id = request.user.id
                l_model.entity_related_id = request.user.get_entity_id()
                l_model.updated_by = request.user.email
                l_model.save()

                messages.success(request, 'Team Encryption atualizada com sucesso')

                return redirect('/teamencryption')
            context = {
                'form': form, 'p_id': p_id, 'l_content': l_content,

            }

            return render(request, 'portal_team_encryption_edit.html', context)
        else:
            return render(request, '403.html')

    except IntegrityError as e:
        context = {
            'form': form, 'p_id': p_id,
            'l_content': l_content,

            'message': e.__cause__}
        return render(request, 'portal_team_encryption_edit.html', context)
    except Exception as er:
        print(er)
        return render(request, '500.html')


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------- Delete ---------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------

def portal_team_encryption_delete(request, p_id):
    try:

        l_content = get_object_or_404(TeamEncryption, pk=p_id)


        if l_content.entity_related_id == request.user.get_entity_id() or True:
            TeamEncryption.objects.get(pk=int(p_id)).delete()
            messages.warning(request, 'Team Encryption removido')
            return redirect('/teamencryption')

        else:
            return render(request, '403.html')
    except:
        return render(request, '500.html')