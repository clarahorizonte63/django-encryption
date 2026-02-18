from django.contrib import admin
from django.urls import path, re_path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # common pages
    #re_path(r'^', include('common.urls')),
    # public pages
    re_path(r'^', include('portal.urls')),
]
