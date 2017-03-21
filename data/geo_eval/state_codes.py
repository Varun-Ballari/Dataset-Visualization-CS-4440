# Tiger/Line country shapefiles'  "statefp" field is the FIPS code.
# The following is http://www.epa.gov/enviro/html/codes/state.html

data = """
State Abbreviation	FIPS Code	State Name
AK	02	ALASKA
AL	01	ALABAMA
AR	05	ARKANSAS
AS	60	AMERICAN SAMOA
AZ	04	ARIZONA
CA	06	CALIFORNIA
CO	08	COLORADO
CT	09	CONNECTICUT
DC	11	DISTRICT OF COLUMBIA
DE	10	DELAWARE
FL	12	FLORIDA
GA	13	GEORGIA
GU	66	GUAM
HI	15	HAWAII
IA	19	IOWA
ID	16	IDAHO
IL	17	ILLINOIS
IN	18	INDIANA
KS	20	KANSAS
KY	21	KENTUCKY
LA	22	LOUISIANA
MA	25	MASSACHUSETTS
MD	24	MARYLAND
ME	23	MAINE
MI	26	MICHIGAN
MN	27	MINNESOTA
MO	29	MISSOURI
MS	28	MISSISSIPPI
MT	30	MONTANA
NC	37	NORTH CAROLINA
ND	38	NORTH DAKOTA
NE	31	NEBRASKA
NH	33	NEW HAMPSHIRE
NJ	34	NEW JERSEY
NM	35	NEW MEXICO
NV	32	NEVADA
NY	36	NEW YORK
OH	39	OHIO
OK	40	OKLAHOMA
OR	41	OREGON
PA	42	PENNSYLVANIA
PR	72	PUERTO RICO
RI	44	RHODE ISLAND
SC	45	SOUTH CAROLINA
SD	46	SOUTH DAKOTA
TN	47	TENNESSEE
TX	48	TEXAS
UT	49	UTAH
VA	51	VIRGINIA
VI	78	VIRGIN ISLANDS
VT	50	VERMONT
WA	53	WASHINGTON
WI	55	WISCONSIN
WV	54	WEST VIRGINIA
WY	56	WYOMING
"""


data = data.strip().split("\n")[1:]
data = [x.split("\t") for x in data]

fips2postal = {}
for postal, fips, longname in data:
  fips2postal[fips] = postal

#print data
#print fips2postal
