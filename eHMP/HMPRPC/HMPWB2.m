HMPWB2 ;;PJH/SLC - WRITEBACK DEMOGRAPHICS/VITALS TO VISTA; 12/14/2014
 ;;1.0;EHMP;**PJH**;DEC 11 2014;Build 21
 ;
 Q
 ;
DEMOG(RSLT,IEN,DFN,DATA) ;File demographic data - WIP not part of PSI 6
 ;
 ;Output
 ; RSLT = JSON format string for demographics
 ;Input
 ; IEN  = record to be updated (not used)
 ; DFN  = patient IEN
 ; DATA("data") - input format - string
 ;   Piece 1: DFN
 ;   Piece 2: Home Phone Number - ^DD(2,.131 - ^DPT(DFN,.13) piece 1
 ;   Piece 3: Cell Phone Number - ^DD(2,.134 - ^DPT(DFN,.13) piece 4
 ;   Piece 4: Work Phone Number - ^DD(2,.132 - ^DPT(DFN,.13) piece 2
 ;   Piece 5: Emergency Phone Number - ^DD(2,.339 - ^DPT(DFN,.33) piece 9
 ;   Piece 6: NOK Phone Number - ^DD(2,.219 - ^DPT(DFN,.21) piece 9
 ;
 ; If a piece contains -1, it means DELETE it
 ; If a piece is null, it means LEAVE it ALONE
 ; If a piece is not -1 and not null, it means UPDATE it
 ;
 ;Update Demographics Logic
 ;-------------------------
 ;Quit if DFN is not defined - IEN is not used
 S RSLT="ERROR" Q:'$G(DFN)
 ;Assume input is presented as a string with DFN in piece1
 N HMP,HMPI,INVAR,OUTVAR
 S INVAR=$G(DATA("data")) Q:$P(INVAR,U)'=DFN
 ;Call existing HMPPTDEM api
 D FILE^HMPPTDEM(.OUTVAR,INVAR) I $G(OUTVAR(0))'=1 M RSLT=OUTVAR Q
 ;Build JSON in ^TMP("HMP",$J) from VistA - expects DFN to be defined
 S HMP=$NA(^TMP("HMP",$J)),HMPI=0 K @HMP
 D DPT1^HMPDJ00
 ;Call $$EXTRACT to pass JSON back as RSLT string
 S RSLT=$$EXTRACT(HMP)
 ;Clear work files
 K @HMP
 Q
 ;
VMADD(RSLT,IEN,DFN,DATA) ;Add vital measurement
 ;
 ;
 ; Note: Original GMVDCSAV routine supports the following IAs:
 ; #3996 - GMV ADD VM RPC called at EN1  (private)
 ;
 ;Output
 ; RSLT = JSON format string for vital added
 ;Input
 ; IEN  = record to be updated (not used)
 ; DFN  = patient IEN (not used, DFN is sent in $P(DATA,"^",2)
 ; DATA - input format - string
 ;   piece1 = date/time in FileMan internal format
 ;   piece2 = patient number from FILE 2 (i.e., DFN)
 ;   piece3 = vital type, a semi-colon, the reading, a semi-colon, and
 ;            oxygen flow rate and percentage values [optional] (e.g.,
 ;            21;99;1 l/min 90%)
 ;   piece4 = hospital location (FILE 44) pointer value
 ;   piece5 = FILE 200 user number (i.e., DUZ), an asterisk, and the 
 ;            qualifier (File 120.52) internal entry numbers separated by
 ;            colons (e.g., 547*50:65)
 ; Example:
 ;            "3051011.1635^134^1;120/80;^67^87*2:38:50:75"
 ;
 ;Add Vital Logic
 ;---------------
 N HMPDFN
 ;Quit if DFN is null or IEN is not zero
 S RSLT="ERROR" Q:$G(IEN)'=0
 ;Assume input is presented as a string with DFN in second piece
 N HMP,HMPI,INVAR,OUTVAR,GMRIEN,SEQ,TOT,HMPODT,HMP
 S HMPODT=$P(DATA,"^",1),HMPODT=17000000+$P(HMPODT,".",1)_$P(HMPODT,".",2)
 S HMP=$NA(^TMP("HMP",$J)),HMPI=0 K @HMP
 S INVAR=$G(DATA) I $P(INVAR,U,2)'?1N.N S RSLT="DFN NOT PRESENT IN DATA STRING" Q
 S HMPDFN=$P(INVAR,U,2)
 ;Add vital record to file #120.5
 D EN1^GMVDCSAV(.OUTVAR,INVAR) I $G(OUTVAR(0))="ERROR" S RSLT="ERROR ADDING VITAL TO FILE 120.5" Q
 ;Check if added record exist in VistA
 S GMRIEN=$$FINDVM(HMPDFN) I 'GMRIEN S RSLT="RECORD DOES NOT EXIST IN VISTA" Q
 ;Determine total count and sequence
 S TOT=$$COUNTVM(HMPDFN,GMRIEN,.SEQ)
 ;Build JSON in ^TMP("HMP",$J) from VistA data in file #120.5
 D GMV1(HMPDFN,GMRIEN,SEQ,TOT)
 ;Call $$EXTRACT to pass JSON back as RSLT string
 S RSLT=$$EXTRACT(HMP)
 M ^TMP("HMPVIT",$J)=RSLT
 K RSLT
 S RSLT=$NA(^TMP("HMPVIT",$J))
 ;Clear work files
 K @HMP
 Q
 ;
VMERR(RSLT,DATA) ;Mark vital measurement entered in error
 ;
 ; Note: Original GMRVUTL1 routine supports the following IAs:
 ; #4414 - GMV MARK ERROR RPC is called at ERROR (private)
 ;
 ;Output
 ; RSLT = JSON format string for vital added
 ;Input
 ; DATA - Input format - string 
 ;    piece1 = FILE #120.5 IEN
 ;    piece2 = DUZ
 ;    piece3 
 ;      1 = INCORRECT DATE/TIME
 ;      2 = INCORRECT READING
 ;      3 = INCORRECT PATIENT
 ;      4 = INVALID RECORD
 ; Example:
 ;            "24048^134^2"
 ;
 ;Mark in error logic
 ;-------------------
 ;Quit if IEN is null
 ;S RSLT="ERROR" Q:'$P(DATA,U,1)'?1N.N
 S RSLT="ERROR" ;Q:'$P(DATA,U,1)'?1N.N
 ;Assume input is presented as a string with 120.5 ien in piece 1
 ;N HMP,HMPI,INVAR,OUTVAR,GMRIEN
 S HMP=$NA(^TMP("HMP",$J)),HMPI=0 K @HMP
 ;S INVAR=$G(DATA),GMRIEN=$P(INVAR,U) Q:'GMRIEN  Q:GMRIEN'=IEN
 S INVAR=$G(DATA),GMRIEN=$P(INVAR,U) Q:'GMRIEN  ;Q:GMRIEN'=IEN
 ;Get the DFN for this Vital reading
 S DFN=$P($G(^GMR(120.5,GMRIEN,0)),U,2) Q:'DFN
 ;Call existing GRMVUTL1 api - seq logic
 D ERROR^GMVUTL1(.OUTVAR,INVAR) Q:OUTVAR'="OK"
 ;Determine total count and sequence
 S TOT=$$COUNTVM(DFN,GMRIEN,.SEQ)
 ;Build JSON in ^TMP("HMP",$J) from VistA data in file #120.5
 D GMV1(DFN,GMRIEN,.SEQ,TOT)
 ;Call $$EXTRACT to pass JSON back as RSLT string
 S RSLT=$$EXTRACT(HMP)
 M ^TMP("HMPVIT",$J)=RSLT
 K RSLT
 S RSLT=$NA(^TMP("HMPVIT",$J))
 ;Clear work files
 K @HMP
 Q
 ;
GMV1(DFN,ID,SEQ,TOT) ; -- vital/measurement ^UTILITY($J,"GMRVD",HMPIDT,HMPTYP,ID)
 ; Note: this code is a copy of GMV1^HMPDJ02 with addition of header 
 N HMPY,X0,TYPE,LOC,FAC,X,Y,MRES,MUNT,HIGH,LOW,I,ARRAY,VIT,FILTER
 S FILTER("id")=ID
 S FILTER("noHead")=1
 S FILTER("domain")="vital"
 S FILTER("patientId")=DFN
 D GET^HMPDJ(.RSLT,.FILTER)
 K ^TMP("VITAL",$J)
 M ^TMP("VITAL",$J)=@RSLT
 S RSLT=$NA(^TMP("VITAL",$J))
 ;I $G(HMPERR)'="" S RSLT=HMPERR Q
 S HMPFCNT=0
 S HMPUID=$$SETUID^HMPUTILS("vital",DFN,GMRIEN)
 S HMPE=^TMP("VITAL",$J,1,1)
 S STMPTM=$TR($P($P(HMPE,"lastUpdateTime",2),","),""":")
 D ADHOC^HMPUTIL2("vital",HMPFCNT,DFN,HMPUID,STMPTM)
 K RSLT
 ;M RSLT=^TMP("HMPF",$J)
 Q
 ;
FINDVM(DFN) ;Get most recent vital measurement for this patient
 Q $O(^GMR(120.5,"C",DFN,"A"),-1)
 ;
COUNTVM(DFN,IEN,SEQ) ;Count vitals for this patient
 N SUB,TOT S SUB=0,SEQ=0,TOT=0
 F  S SUB=$O(^GMR(120.5,"C",DFN,SUB)) Q:'SUB  D
 .;Ignore entered in error
 .Q:$P($G(^GMR(120.5,SUB,2)),U)=1
 .;Save SEQ if this is the entry
 .S TOT=TOT+1 S:SUB=IEN SEQ=TOT
 ;Return count of vitals for this patient (plus sequence in SEQ)
 Q TOT
 ;
EXTRACT(GLOB) ; Move ^TMP("HMP",$J) into string format
 N HMPSTOP,HMPFND
 S RSLT="",X=0,HMPSTOP=0,HMPFND=0
 S (I,J)=0
 F  S I=$O(^TMP("HMPF",$J,I)) Q:I=""!(HMPSTOP)  D
 . F  S J=$O(^TMP("HMPF",$J,I,J)) Q:J=""  D
 .. I $G(^TMP("HMPF",$J,I,J))["syncStatus" D
 ... Q:$P(^TMP("HMPF",$J,I,J),":",1)["domainTotals"
 ... S RSLT(X)=RSLT(X)_$P(^TMP("HMPF",$J,I,J),",",1)
 ... S HMPSTOP=1
 ... Q
 .. Q:$G(^TMP("HMPF",$J,I,J))=""
 .. Q:$P(^TMP("HMPF",$J,I,J),",",1)'["vital"
 .. Q:$P(^TMP("HMPF",$J,I,J),",",4)'["localId"
 .. Q:$P(^TMP("HMPF",$J,I,J),":",1)["domainTotals"
 .. S X=X+1
 .. S RSLT(X)=$G(^TMP("HMPF",$J,I,J))
 .. F  S J=$O(^TMP("HMPF",$J,I,J)) Q:J=""  D
 ... Q:$P(^TMP("HMPF",$J,I,J),":",1)["domainTotals"
 ... S X=X+1
 ... S RSLT(X)=$G(^TMP("HMPF",$J,I,J))
 ... S HMPFND=1
 ... Q
 .. S I=$O(^TMP("HMPF",$J,I))
 .. Q
 . Q
 Q RSLT
