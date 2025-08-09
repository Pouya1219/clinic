
from pathlib import Path
import os
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ابتدا فایل .env را لود می‌کنیم
from dotenv import load_dotenv
load_dotenv()
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-6m_#68wuv8tg##@yq_757(w1mx$ufaye03vogv-c8(&epa-rf('

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'channels',
    'users',
    'Patient',
    'jalali_date',
    'django_filters',
    'schedules',
    'appointments',
    'settings',
    'rest_framework',
    'Treatment',
    'inventory',
    
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'zibadent.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'Patient.context_processors.notifications_processor',
                'inventory.context_processors.websocket_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'zibadent.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'mssql',  # موتور پایگاه داده برای SQL Server
        'NAME': 'clinic',                   # نام دیتابیس
        'USER': 'sa',
        'PASSWORD': 'K@l@d@1@3',
        'HOST': 'localhost',                  # آدرس سرور (در لوکال هاست)
        'PORT': '1433',                       # پورت پیش‌فرض SQL Server
        'OPTIONS': {
        'driver': 'ODBC Driver 17 for SQL Server',  # درایور مناسب برای اتصال
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
# مسیر فایل‌های استاتیک برای توسعه (نباید شامل STATIC_ROOT باشد)
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),  # مسیر صحیح برای فایل‌های استاتیک
]

# مسیر فایل‌های استاتیک برای حالت Production
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")  # محل ذخیره فایل‌های استاتیک بعد از `collectstatic`


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

SOFTWARE_VERSION = "1.0.0"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.CustomUser'

LOGIN_URL = ""

SESSION_COOKIE_AGE = 86400
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = True

#websocket
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}



# تنظیمات سرور - اول این متغیرها را تعریف می‌کنیم
SERVER_HOST = os.getenv('SERVER_HOST', '127.0.0.1')
SERVER_PORT = os.getenv('SERVER_PORT', '8001')

# تنظیمات وب‌سوکت موجود
WEBSOCKET_HOST = os.getenv('WEBSOCKET_HOST', SERVER_HOST)
WEBSOCKET_PORT = os.getenv('WEBSOCKET_PORT', '8001') 
WEBSOCKET_PATH = os.getenv('WEBSOCKET_PATH', 'ws/inventory/')
WEBSOCKET_URL = f"ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}/{WEBSOCKET_PATH}"

# تنظیمات وب‌سوکت اعلان‌ها - استفاده از همان پورت
NOTIFICATIONS_WEBSOCKET_HOST = os.getenv('NOTIFICATIONS_WEBSOCKET_HOST', WEBSOCKET_HOST)
NOTIFICATIONS_WEBSOCKET_PORT = os.getenv('NOTIFICATIONS_WEBSOCKET_PORT', WEBSOCKET_PORT)
NOTIFICATIONS_WEBSOCKET_PATH = os.getenv('NOTIFICATIONS_WEBSOCKET_PATH', 'ws/notifications/')
NOTIFICATIONS_WEBSOCKET_URL = f"ws://{NOTIFICATIONS_WEBSOCKET_HOST}:{NOTIFICATIONS_WEBSOCKET_PORT}/{NOTIFICATIONS_WEBSOCKET_PATH}"


# # Logging
# Logging
# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'formatters': {
#         'verbose': {
#             'format': '{levelname} {asctime} {module} {message}',
#             'style': '{',
#         },
#     },
#     'handlers': {
#         'file': {
#             'level': 'INFO',
#             'class': 'logging.FileHandler',
#             'filename': 'debug.log',
#             'formatter': 'verbose',
#             'encoding': 'utf-8',  # مهم: تنظیم کدگذاری فایل
#         },
#         'console': {  # اضافه کردن handler برای کنسول
#             'level': 'INFO',
#             'class': 'logging.StreamHandler',
#             'formatter': 'verbose',
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['file', 'console'],  # اضافه کردن console به handlers
#             'level': 'INFO',
#             'propagate': True,
#         },
#         'inventory': {  # نام اپلیکیشن شما
#             'handlers': ['file', 'console'],  # اضافه کردن console به handlers
#             'level': 'INFO',
#             'propagate': True,
#         },
#     },
# }

# تنظیم کدگذاری برای stdout و stderr
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
