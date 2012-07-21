# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^m/?', include('acc_urls')),
    (r'^/?', include('api_urls')),
)
# vim: set noexpandtab:
