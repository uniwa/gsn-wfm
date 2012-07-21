#!/usr/bin/env python
#-*- coding: utf8 -*-

from wfm_db import *

db = db_connect()


q = { 'school' : {'$exists': False}, 'class' : {'$exists': False}, 'grade' : {'$exists': False} }
update = { '$set': { 'school': None, 'class': None, 'grade': None } }

outdated = db.user_fs.find(q).count()
print '=============================================='
print 'Will update entries for %s objects...' % outdated,

db.user_fs.update(q, update, multi=True)

print 'DONE'
print '=============================================='

print 'getLastError shows:'
print db.command('getLastError')
