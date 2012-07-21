#!/usr/bin/env python

import sys
import os
import datetime
import time
import mimetypes
from uuid import uuid4
from pymongo import Connection
from gridfs import GridFS

backup_path = '/tmp/mongobak'

db = Connection()['database']
gfs = GridFS(db)


users = []
if len(sys.argv) == 2:
    users.append(sys.argv[1])
else:
    print "invalid username argument"
    print "assuming restore all..."
    try:
        print "getting usernames from backup folder"
        users = os.listdir(backup_path)
        print "found %s users" % len(users)
    except OSError, e:
        print "restore path does not exist"
        print "quit ==> %s" % e
        sys.exit()
    

def get_home_id(username):
    try:
        home_id = db['user_fs'].find_one({'owner': username})['home_id']
    except:
        return False
    return home_id


def mongo_restore(username, path, parent_id):
    items = os.listdir(path)
    for item in items:
        doc = os.path.join(path, item)

        if os.path.isdir(doc):
            doc_id = create_mongo_folder(item, username, parent_id)
            mongo_restore(username, doc, doc_id)
        else:
            create_mongo_file(username, doc, parent_id)

def tsl(username, size):
    fs = db.user_fs.find_one({'owner': username}, ['quota'])
    if not fs:
        return False
    
    quota = fs['quota']

    for i in range(0,5):
        #Test if path not already locked, lock path
        db.user_fs.update({'owner': username,
                        'used_space': {'$lte': quota - size},
                        'locked': False}, {'$set': {'locked' : True}})
    
        err = db.command({'getlasterror':1})
    
        #Test if update succedded
        if err['updatedExisting']:
            return True
        
        time.sleep(3)
    return False


def create_mongo_folder(name, username, parent_id):
    # lock fs
    if  not tsl(username, 0):
        return False

    public = {'users': [], 'groups': []}
    doc_id = 'd' + uuid4().hex

    #Insert new folder
    new_folder = gfs.new_file(type= 'folder', 
                            content_type = 'folder',
                            name = name,
                            owner = username,
                            public = public, tags = [],
                            _id = doc_id,
                            parent_id = parent_id,
                            old_parent_id = '0',
                            deleted = False,
                            global_public = False,
                            thumbnail = [],
                            subtree_size = 0,
                            bookmarked = False )
    new_folder.close()
    
    #Release
    db.user_fs.update({'owner': username}, {'$set': {'locked': False}, '$inc': {'used_space': 0}})
    return doc_id


def size_propagation(username, parent_id, size):
    #Get parent
    parent = db.fs.files.find_one({'owner': username, '_id': parent_id}, ['parent_id'])
    if parent:
        #Increase size
        db.fs.files.update({'_id': parent['_id']}, {'$inc': {'subtree_size': size}})
        #Propagate to parent's parent
        size_propagation(username, parent['parent_id'], size)


def create_mongo_file(username, path, parent_id):
    # lock fs
    if  not tsl(username, 0):
        return False

    name = os.path.basename(path)
    size = os.path.getsize(path)

    # not public by default
    public = {'users': [], 'groups': []}
    
    # mime type
    mime_type = mimetypes.guess_type(name)[0]
    if not mime_type:
        mime_type = 'Unknown'
    
    # generate file_id
    file_id = 'd' + uuid4().hex
    
    new_file = gfs.new_file(_id = file_id,
                            type = 'file',
                            content_type = mime_type,
                            name = name,
                            owner = username,
                            public = public, tags = [],
                            parent_id = parent_id,
                            old_parent_id = '0',
                            deleted = False,
                            global_public = False,
                            subtree_size = size,
                            bookmarked = False)

    # open file
    f = open(path, 'r')

    # read in 64K chunks and save
    while True:
        chunk = f.read(65536)
        if not chunk:
            break
        new_file.write(chunk)

    new_file.close()
    size_propagation(username, parent_id, size)

    #Release
    db.user_fs.update({'owner': username}, {'$set': {'locked': False}, '$inc': {'used_space': size}})
    return file_id


# restore process
for user in users:
    # get user home id or skip
    home_id = get_home_id(user)
    if home_id is False:
        print "User %s does not exist in mongodb, skipping.." % user
        continue

    # build to read backup files
    path = os.path.join(backup_path, user)

    # create the restore folder name
    now = datetime.datetime.now()
    # folder name format: restore-YearMonthDayHourMinute
    restore_folder = "restore-" + now.strftime('%Y%m%d%H%M')

    # create restore folder
    restore_id = create_mongo_folder(restore_folder, user, home_id)
    if restore_id is False:
        print "error creating restore folder, skipping restore for user %s" % user
        continue

    # restore files
    mongo_restore(user, path, restore_id)



# vim: set sw=4 ts=4 sts=4 et:
