#!/bin/sh

WFM='/srv/htdocs/wfm2'
WFM_VER_CUR='version-current'
WFM_VER_STABLE='version-stable'

APACHE='/etc/init.d/apache2'
APACHE_U='www-data'
APACHE_G='www-data'

SVN=`which svn` || exit 1
SVNVER=`which svnversion` || exit 1
CHOWN=`which chown` || exit 1
FIND=`which find` || exit 1


echo "going into ${WFM}"
cd ${WFM}

CUR=`svnversion`
if [ "${CUR}" == `cat ${WFM_VER_CUR}` ];
then
  echo "Already up to date"
  exit 0
fi

${APACHE} stop

echo "saving current version as stable..."
# send current version to file
echo ${CUR} > ${WFM_VER_STABLE}
echo -n "DONE"

echo "synching repo..."
${SVN} update

echo "saving current version..."
# send output of svnversion to file
${SVNVER} > ${WFM_VER_CUR}
echo -n "DONE"

echo "removing .pyc files..."
${FIND} ${WFM} -type f -name '*.pyc' -delete
echo -n "DONE"

echo "fixing permissions..."
${CHOWN} ${APACHE_U}:${APACHE_G} ${WFM} -R
echo -n "DONE"

${APACHE} start

echo "bye"

# vim: ts=2 sw=2 et:
