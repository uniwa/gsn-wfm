#!/usr/bin/env python
#-*- coding: utf8 -*-

from wfm_db import *

db = db_connect()

outdated = db.user_fs.find({ 'notifications' : { '$exists' : False} }).count()
print 'Will update entries for %s objects.' % outdated

db.user_fs.update({ 'notifications' : { '$exists' : False } }, { '$set': { 'notifications': [] } }, multi=True)

print 'DONE'
print 'getLastError shows:'
print db.command('getLastError')
