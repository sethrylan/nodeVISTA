HMPAT ;AGILEX/EJK - ASU/TIU Trigger to HMP Activity File ;3/31/15  15:29
 ;;2.0;ENTERPRISE HEALTH MANAGEMENT PLATFORM;**1**;;Build 35
 ;
 ; 
ECLASS(HMPIEN) ; called from EDIT^USRCLASS,ADD^USRRULA
 N HMPSYS,TYPE,HMPMAX,HMPI,HMPID,HMPERR,HMPTN,HMPLAST,HMPCNT,HMPFINI,HMPFRSP,HMPARGS
 N $ES,$ET,ERRMSG
 S HMPID=$P($G(USRDATA),U,2)
 S HMP=$NA(^TMP("HMP",$J)),HMPI=0 K @HMP
 S HMPSYS=$$GET^XPAR("SYS","HMP SYSTEM NAME")
 S (HMPMAX,HMPLAST,HMPID)="",HMPCNT=0
 S HMPARGS("server")=$O(^HMP(800000,"B",""))
 S HMPARGS("command")="startOperationalDataExtract"
 S HMPARGS("domains")="asu-class"
 D API^HMPDJFS(.HMPRSLT,.HMPARGS)
 Q
 ;
ERULE ; called from EDIT1^USRRULA
 N HMPSYS,TYPE,HMPMAX,HMPI,HMPID,HMPERR,HMPTN,HMPLAST,HMPCNT,HMPFINI,HMPFRSP,HMPARGS
 N $ES,$ET,ERRMSG
 S HMP=$NA(^TMP("HMP",$J)),HMPI=0 K @HMP
 S HMPSYS=$$GET^XPAR("SYS","HMP SYSTEM NAME")
 S (HMPMAX,HMPLAST,HMPID)="",HMPCNT=0
 S HMPARGS("server")=$O(^HMP(800000,"B",""))
 S HMPARGS("command")="startOperationalDataExtract"
 S HMPARGS("domains")="asu-rule"
 D API^HMPDJFS(.HMPRSLT,.HMPARGS)
 Q
 ;
EDEF ; called from option TIU DOCUMENT DEFINITION EDIT
 N HMPDA
 S HMPDA=$P(XQLOK,",",2),HMPDA=$TR(HMPDA,")","")
 I HMPDA?1N.N,$D(^TIU(8925.1,HMPDA)) D POSTX^HMPEVNT("doc-def",HMPDA)
 I HMPDA?1N.N,'$D(^TIU(8925.1,HMPDA)) D POSTX^HMPEVNT("doc-def",HMPDA,"@")
 Q
