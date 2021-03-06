#---------------------------------------------------------------------------
# Copyright 2011 The Open Source Electronic Health Record Agent
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#---------------------------------------------------------------------------

## Post Import Setup
##

'''
This script sets up VistA after the Routines and Globals import is complete

@copyright The Open Source Electronic Health Record Agent
@license http://www.apache.org/licenses/LICENSE-2.0
'''
import sys
sys.path = ['/vagrant/VistA/Python/vista'] + sys.path


import os
import time
import OSEHRASetup
from OSEHRAHelper import ConnectToMUMPS,PROMPT

VistA=ConnectToMUMPS("./VistA/bin/Testing/Log/PostImport1.log","CACHE","VISTA")
if ('' and ''):
  VistA.login('','')
if VistA.type=='cache':
  try:
    VistA.ZN('VISTA')
  except IndexError,no_namechange:
    pass
VistA.wait(PROMPT,60)
#---------------------------------------------------------------------
#- SECTION TO SETUP DEMO VistA SITE -
#---------------------------------------------------------------------

#Initialize FileMan
# Pass a site name from CMake and have a default site name of 6161

OSEHRASetup.initializeFileman(VistA,"DEMO.NODEVISTA.ORG","6161")

# Setup the primary HFS directory from the
# Kernel System Parameters file via FileMan
#
# Use an "@" to remove or set a new file path.


OSEHRASetup.setupPrimaryHFSDir(VistA,'@')

# Ensure that the null device is correctly configured by adding
# a $I for the correct platform rather than VMS and removing
# sign-on capabilities

OSEHRASetup.configureNULLDevice(VistA)

# Change the /dev/tty device (GTM-UNIX-CONSOLE) to set
# SIGN-ON/SYSTEM DEVICE to be "Yes"

OSEHRASetup.configureConsoleDevice(VistA)

# Create and Christen the New Domain:
# Enter the site name into the DOMAIN file then
# christen the domain via the XMUDCHR routine.
# Finally, add entries of new domain to
# Kernel System Parameters and RPC Broker Site Parameters
# and re-index both files.

OSEHRASetup.setupVistADomain(VistA,"DEMO.NODEVISTA.ORG")

# Set up the proper Box:Volume pair
# VistA.getenv will query the instance for the local Box:Volume pair
# and save the result as the "boxvol" parameter of the VistA object
# IE. It can be printed via 'print VistA.boxvol'
OSEHRASetup.setupBoxVolPair(VistA,'PLA','DEMO.NODEVISTA.ORG','9430')
OSEHRASetup.setupVolumeSet(VistA,"DEMO.NODEVISTA.ORG",'PLA',"VISTA")

# Start TaskMan
if VistA.type=='cache':
  # If using Cache as the M environment, Schedule a task to start the
  # XWB Listener Starter on the start up of TaskMan
  OSEHRASetup.scheduleOption(VistA,'XWB LISTENER STARTER')
  OSEHRASetup.scheduleOption(VistA,'XMRONT')

# Start TaskMan through the XUP Menu system.
OSEHRASetup.restartTaskMan(VistA)

#Create the System Manager
OSEHRASetup.addSystemManager(VistA)

# Open FileMan and create the VistA Health Care institution
OSEHRASetup.addInstitution(VistA,"VISTA HEALTH CARE","6100")


# Create the Medical Center Division of
# the VistA Health Care institution

OSEHRASetup.addDivision(VistA,'VISTA MEDICAL CENTER',"6101","6100")

# The Sikuli test for CPRS orders a Streptozyme test for the patient
# This information ensures the test can be ordered at the VistA Health care
# Facility
OSEHRASetup.setupStrepTest(VistA)

#Register the Vitals DLL and GUI Versions within the XPAR Menu
OSEHRASetup.registerVitalsCPRS(VistA)

OSEHRASetup.signonZU(VistA,"SM1234","SM1234!!")

OSEHRASetup.addDoctor(VistA,"ALEXANDER,ROBERT","RA","000000029","M","fakedoc1","2Doc!@#$")

#Enter the Nurse Mary Smith
OSEHRASetup.addNurse(VistA,'SMITH,MARY','MS','000000030','F','fakenurse1','2Nur!@#$')

# Add a clerk user with permissions for Problem List Data entry
OSEHRASetup.addClerk(VistA,"CLERK,JOE","JC","000000112","M","fakeclerk1","2Cle!@#$")
#Create a new Order Menu
OSEHRASetup.createOrderMenu(VistA)

#Give all users of the instance permission to mark allergies as "Entered in error')
OSEHRASetup.addAllergiesPermission(VistA)

#Give Mary Smith permission to create shared templates
OSEHRASetup.addTemplatePermission(VistA,"MS")


# Add clinic via the XUP menu to allow scheduling
OSEHRASetup.createClinic(VistA,'VISTA HEALTH CARE','VHC','M')

time.sleep(10)
#Set up the Doctors electronic signature
VistA=ConnectToMUMPS("./VistA/bin/Testing/Log/PostImportSignature.log","CACHE","VISTA")
if ('' and ''):
  VistA.login('','')
if VistA.type=='cache':
  try:
    VistA.ZN('VISTA')
  except IndexError,no_namechange:
    pass
OSEHRASetup.setupElectronicSignature(VistA,"fakedoc1",'2Doc!@#$','1Doc!@#$','ROBA123')

#Set up the Nurse electronic signature
VistA=ConnectToMUMPS("./VistA/bin/Testing/Log/PostImport4.log","CACHE","VISTA")
if ('' and ''):
  VistA.login('','')
if VistA.type=='cache':
  try:
    VistA.ZN('VISTA')
  except IndexError,no_namechange:
    pass
OSEHRASetup.setupElectronicSignature(VistA,"fakenurse1","2Nur!@#$","1Nur!@#$","MARYS123")

#Set up the Clerk verification code
VistA=ConnectToMUMPS("./VistA/bin/Testing/Log/PostImport5.log","CACHE","VISTA")
if ('' and ''):
  VistA.login('','')
if VistA.type=='cache':
  try:
    VistA.ZN('VISTA')
  except IndexError,no_namechange:
    pass
OSEHRASetup.setupElectronicSignature(VistA,"fakeclerk1","2Cle!@#$","1Cle!@#$","CLERKJ123")

# Add patient to the instance using the registration menu.
# Not using the Clerk user to avoid dropping the connection on the error when trying to connect to the MPI.
# and the Register a Patient menu option.
# The patient can be a veteran but not service connected
VistA=ConnectToMUMPS("./VistA/bin/Testing/Log/AddPatients.log","CACHE","VISTA")
if ('' and ''):
  VistA.login('','')
if VistA.type=='cache':
  try:
    VistA.ZN('VISTA')
  except IndexError,no_namechange:
    pass
# Function arguments:
# VistA, Patient Name, Patient Sex,Patient DOB, Patient SSN, Patient Veteran?
# OSEHRASetup.addPatient(VistA,'/vagrant/VistA/Testing/Functional/dataFiles/patdata0.csv')
