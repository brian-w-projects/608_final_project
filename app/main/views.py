from flask import render_template, request, jsonify, session, flash, redirect, url_for, current_app
from . import main
# from .forms import
from ..models import Populations, Counties, Metros, Metros_Counties, States
from .. import db
from sqlalchemy import or_, func
import re


@main.route('/')
def index():
    metros = db.session.query(Metros)\
        .order_by(Metros.metro)\
        .all()
    return render_template('main/index.html', metros=metros)


@main.route('/metro')
def metro():
    metros = map(int, re.findall('\d+', request.args.get('metros')))

    query = db.session.query(Metros.id, Metros.metro, Populations.year, func.sum(Populations.population).label('population'), Metros.latitude, Metros.longitude)\
        .join(Metros_Counties)\
        .join(Counties)\
        .join(Populations)\
        .filter(Metros.id.in_(metros))\
        .group_by(Metros.id, Populations.year)\
        .order_by(Metros.id, Populations.year)\
        .all()

    metros = map(int, re.findall('\d+', request.args.get('metros')))
    counties = db.session.query(Counties.county, Metros.id, Metros.metro, Populations.population, Populations.year)\
        .join(States)\
        .join(Populations)\
        .join(Metros_Counties)\
        .join(Metros) \
        .filter(Metros.id.in_(metros)) \
        .all()

    to_ret = dict()
    to_ret['circle'] = [{'sort_by': str(i[1])+'-'+i[4].strftime('%Y'), 'population': i[3], 'county': i[0],
                         'metro': i[2], 'year': i[4].strftime("%Y")}
                             for i in counties ]
    to_ret['line'] = [{'sort_by': i[1], 'population': int(i[3]), 'year': i[2].strftime('%Y'),
                       'lat': i[4], 'lon': i[5]} for i in query]
    return jsonify(to_ret)

