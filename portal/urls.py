from django.urls import path, re_path, include
from portal import views as PortalViews
from portal import views as PortalViews
from portal import view_encryption as EncryptionViews



urlpatterns = [
    # start pages
    re_path(r'^$', EncryptionViews.portal_coworker_encryption, name='portal_coworker_encryption'),


    re_path(r'^coworkerencryption$', EncryptionViews.portal_coworker_encryption, name='portal_coworker_encryption'),
    re_path(r'^coworkerencryption/edit/(?P<p_id>\d+)/$', EncryptionViews.portal_coworker_encryption_edit,
            name='portal_coworker_encryption_edit'),
    re_path(r'^coworkerencryption/add$', EncryptionViews.portal_coworker_encryption_add, name='portal_coworker_encryption_add'),
    re_path(r'^coworkerencryption/delete/(?P<p_id>\d+)/$', EncryptionViews.portal_coworker_encryption_delete,
            name='portal_coworker_encryption_delete'),
    path('test_coworker_encryption', EncryptionViews.test_coworker_encryption, name="test_coworker_encryption"),

    #URLS SHIFT ENCRYPTION
    re_path(r'^shiftencryption$', EncryptionViews.portal_shift_encryption, name='portal_shift_encryption'),
    re_path(r'^shiftencryption/edit/(?P<p_id>\d+)/$', EncryptionViews.portal_shift_encryption_edit, name='portal_shift_encryption_edit'),
    re_path(r'^shiftencryption/add$', EncryptionViews.portal_shift_encryption_add, name='portal_shift_encryption_add'),
    re_path(r'^shiftencryption/delete/(?P<p_id>\d+)/$', EncryptionViews.portal_shift_encryption_delete, name='portal_shift_encryption_delete'),
    path('test_shift_encryption', EncryptionViews.test_shift_encryption, name="test_shift_encryption"),

    #URLS TEAM ENCRYPTION
    re_path(r'^teamencryption$', EncryptionViews.portal_team_encryption, name='portal_team_encryption'),
    re_path(r'^teamencryption/edit/(?P<p_id>\d+)/$', EncryptionViews.portal_team_encryption_edit,
            name='portal_team_encryption_edit'),
    re_path(r'^teamencryption/add$', EncryptionViews.portal_team_encryption_add, name='portal_team_encryption_add'),
    re_path(r'^teamencryption/delete/(?P<p_id>\d+)/$', EncryptionViews.portal_team_encryption_delete,
            name='portal_team_encryption_delete'),
    path('test_team_encryption', EncryptionViews.test_team_encryption, name="test_team_encryption"),


]