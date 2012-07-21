#/usr/bin/env python
#-*- coding: utf8 -*-

from pymongo import Connection

MONGO_SLAVE_OK = False
MONGO_HOST = 'localhost'
MONGO_PORT = 27017

def db_connect():
    return Connection(MONGO_HOST, MONGO_PORT, slave_okay=MONGO_SLAVE_OK).database

