Option Explicit

Public CurrentUserRole As String

'=============================
'   إعدادات البداية
'=============================
Sub StartupSettings()

    Application.ScreenUpdating = False
    
    ' استخدام ThisWorkbook للتأكد من الورقة الصحيحة
    On Error Resume Next
    ThisWorkbook.Worksheets("Dashboard").Visible = xlSheetVeryHidden
    ThisWorkbook.Worksheets("Debt_Alerts").Visible = xlSheetVeryHidden
    On Error GoTo 0
    
    Application.ScreenUpdating = True

End Sub

'=============================
'   نظام تسجيل الدخول
'=============================
Sub LoginSystem()

    Dim password As String
    
    password = InputBox("أدخل كلمة المرور")

    If password = "Eslam@@@@@fat77777y" Then
        
        CurrentUserRole = "Manager"
        EnableManagerAccess
        MsgBox "تم تسجيل الدخول كمدير", vbInformation
        
    ElseIf password = "1234" Then
        
        CurrentUserRole = "Employee"
        EnableEmployeeAccess
        MsgBox "تم تسجيل الدخول كموظف", vbInformation
        
    Else
        
        MsgBox "كلمة المرور غير صحيحة", vbCritical
        ThisWorkbook.Close False
        
    End If

End Sub

'=============================
'   تمكين وصول المدير
'=============================
Sub EnableManagerAccess()

    On Error Resume Next
    
    ThisWorkbook.Worksheets("Dashboard").Visible = xlSheetVisible
    ThisWorkbook.Worksheets("Debt_Alerts").Visible = xlSheetVisible
    
    ThisWorkbook.Worksheets("Sales").Unprotect
    ThisWorkbook.Worksheets("Products").Unprotect
    
    On Error GoTo 0

End Sub

'=============================
'   تمكين وصول الموظف
'=============================
Sub EnableEmployeeAccess()

    On Error Resume Next
    
    ThisWorkbook.Worksheets("Dashboard").Visible = xlSheetVeryHidden
    ThisWorkbook.Worksheets("Debt_Alerts").Visible = xlSheetVeryHidden
    
    ThisWorkbook.Worksheets("Products").Protect password:="lock", UserInterfaceOnly:=True
    ThisWorkbook.Worksheets("Sales").Protect password:="lock", UserInterfaceOnly:=True
    
    On Error GoTo 0

End Sub

'=============================
'   طباعة الفاتورة PDF
'=============================
Sub PrintInvoicePDF()

    Dim FilePath As String
    Dim ClientName As String
    Dim invoiceSheet As Worksheet
    
    On Error Resume Next
    Set invoiceSheet = ThisWorkbook.Worksheets("Invoice")
    On Error GoTo 0
    
    If invoiceSheet Is Nothing Then
        MsgBox "ورقة الفاتورة غير موجودة", vbCritical
        Exit Sub
    End If
    
    ClientName = invoiceSheet.Range("B3").Value
    
    If ClientName = "" Then
        MsgBox "أدخل اسم العميل", vbExclamation
        Exit Sub
    End If
    
    FilePath = ThisWorkbook.Path & "\Invoice_" & ClientName & ".pdf"
    
    On Error Resume Next
    invoiceSheet.ExportAsFixedFormat _
        Type:=xlTypePDF, _
        Filename:=FilePath, _
        Quality:=xlQualityStandard
    
    If Err.Number = 0 Then
        MsgBox "تم حفظ الفاتورة PDF", vbInformation
    Else
        MsgBox "خطأ في حفظ الفاتورة: " & Err.Description, vbCritical
    End If
    On Error GoTo 0

End Sub

'=============================
'   توليد تقرير شهري
'=============================
Sub GenerateMonthlyReport()

    Dim ws As Worksheet
    Dim reportSheet As Worksheet
    Dim lastRow As Long
    Dim monthNumber As Integer
    Dim i As Long
    Dim rowReport As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Sales")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المبيعات غير موجودة", vbCritical
        Exit Sub
    End If
    
    monthNumber = Month(Date)
    
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Worksheets("Monthly_Report").Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    Set reportSheet = ThisWorkbook.Worksheets.Add
    reportSheet.Name = "Monthly_Report"
    
    ws.Rows(1).Copy reportSheet.Rows(1)
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    rowReport = 2
    
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, 2)) Then
            If Month(ws.Cells(i, 2)) = monthNumber Then
                ws.Rows(i).Copy reportSheet.Rows(rowReport)
                rowReport = rowReport + 1
            End If
        End If
    Next i
    
    MsgBox "تم إنشاء التقرير الشهري", vbInformation

End Sub

'=============================
'   فحص الديون
'=============================
Sub CheckDebts()

    Dim ws As Worksheet
    Dim totalDebt As Double
    Dim lastRow As Long
    Dim i As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Sales")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المبيعات غير موجودة", vbCritical
        Exit Sub
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    totalDebt = 0
    
    For i = 2 To lastRow
        If IsNumericValue(ws.Cells(i, 9).Value) Then
            totalDebt = totalDebt + CDbl(ws.Cells(i, 9).Value)
        End If
    Next i
    
    If totalDebt > 0 Then
        MsgBox "إجمالي الديون الحالية: " & Format(totalDebt, "0.00"), vbExclamation
    Else
        MsgBox "لا توجد ديون حالية", vbInformation
    End If

End Sub

'=============================
'   تنبيه المخزون المنخفض
'=============================
Sub LowStockAlert()

    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim alertCount As Integer
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Products")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المنتجات غير موجودة", vbCritical
        Exit Sub
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    alertCount = 0
    
    For i = 2 To lastRow
        If IsNumericValue(ws.Cells(i, 6).Value) Then
            If CDbl(ws.Cells(i, 6).Value) < 10 Then
                MsgBox "تنبيه: المخزون منخفض للمنتج: " & ws.Cells(i, 2).Value, vbExclamation
                alertCount = alertCount + 1
            End If
        End If
    Next i
    
    If alertCount = 0 Then
        MsgBox "جميع المنتجات بمستويات مخزون آمنة", vbInformation
    End If

End Sub

'=============================
'   دالة مساعدة: التحقق من القيم الرقمية
'=============================
Function IsNumericValue(value As Variant) As Boolean
    
    On Error Resume Next
    IsNumericValue = Not IsError(CDbl(value)) And value <> ""
    On Error GoTo 0
    
End Function
