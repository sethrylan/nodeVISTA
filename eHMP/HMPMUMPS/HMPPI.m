HMPPI ;SLC/AGP -- HMP package post install ; 11/23/14 1:00pm
 ;;2.0;ENTERPRISE HEALTH MANAGEMENT PLATFORM;**1**;Sep 01, 2011;Build 49
 ;
POST ;
 ; Create proxy user
 Q:$O(^VA(200,"B","HMP,APPLICATION PROXY",0))
 N X
 S X=$$CREATE^XUSAP("HMP,APPLICATION PROXY","","HMP APPLICATION PROXY")
 Q