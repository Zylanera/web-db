from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, DecimalField, IntegerField, DateField, SelectField
from wtforms.validators import DataRequired, Length, Email, Optional, NumberRange

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(max=255)])
    password = PasswordField('Passwort', validators=[DataRequired()])

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(max=255)])
    email = StringField('E-Mail', validators=[Optional(), Email(), Length(max=255)])
    password = PasswordField('Passwort', validators=[DataRequired()])
    makeAdmin = BooleanField('Als Admin festlegen (erster Admin)')
    adminToken = StringField('Admin-Setup-Token')

class CollectionForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(max=255)])
    description = TextAreaField('Beschreibung')

class BookForm(FlaskForm):
    title = StringField('Titel', validators=[DataRequired(), Length(max=255)])
    cover = StringField('Cover-URL', validators=[Optional(), Length(max=500)])
    description = TextAreaField('Beschreibung')
    price = DecimalField('Preis', validators=[Optional(), NumberRange(min=0)], places=2)
    release_date = DateField('Erscheinungsdatum', validators=[Optional()], format="%Y-%m-%d")
    volumeNumber = IntegerField('Band', validators=[Optional(), NumberRange(min=1)])
    isbn13 = StringField('ISBN-13', validators=[Optional(), Length(min=13, max=13)])
    collection_id = SelectField('Collection', coerce=int, validators=[Optional()])
