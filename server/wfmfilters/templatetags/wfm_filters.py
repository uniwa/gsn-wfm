from django import template
register = template.Library()


@register.filter
def get_id(item):
    try:
        return item["_id"]
    except:
        return ''


@register.filter
def get_mime(item):
    mtypes = [
        # images
        'png', 'jpeg', 'jpg', 'gif', 'bmp', 'svg',
        # office docs
        'doc', 'odt', 'ods', 'odp', 'odb', 'chm', 'pdf', 'rtf', 'xls', 'ppt',
        # packages
        'gz', 'bz2', 'zip', 'rar', 'tgz', 'tbz2', 'xz', 'tar',
        # video / subs
        'mov', 'mp4', 'avi', 'divx', 'mpeg', 'mkv', 'srt', 'sub',
        # audio
        'mp3', 'ogg', 'flac', 'wma',
        # markup
        'html', 'xml', 'kml', 'markdown',
        # misc
        'torrent', 'txt', 'cnf', 'conf', 'exe'
    ]

    try:
        ext = item.split('.')[-1].lower()
    except:
        return 'txt'

    if ext in mtypes:
        return ext

    # handle exceptions starting with letters
    if ext == '7z':
        return 'p7z'

    return 'txt'

