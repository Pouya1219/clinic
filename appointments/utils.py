import datetime
from khayyam import JalaliDate

def gregorian_to_jalali(gy, gm, gd):
    jalali_date = JalaliDate(gy, gm, gd)
    return (jalali_date.year, jalali_date.month, jalali_date.day)

def jalali_to_gregorian(jy, jm, jd):
    gregorian_date = JalaliDate(jy, jm, jd).todate()
    return (gregorian_date.year, gregorian_date.month, gregorian_date.day)
