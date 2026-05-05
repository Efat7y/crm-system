Option Explicit

Public CurrentUserRole As String

'=============================
'   إعدادات البداية
'=============================
Sub StartupSettings()

    Application.ScreenUpdating = False
    
    ' إنشاء الأوراق الأساسية إذا لم تكن موجودة
    CreateSheetIfNotExists "Dashboard"
    CreateSheetIfNotExists "Sales"
    CreateSheetIfNotExists "Products"
    CreateSheetIfNotExists "Invoice"
    CreateSheetIfNotExists "Debt_Alerts"
    
    ' إدراج البيانات النموذجية
    CreateSampleData
    
    ' إخفاء الأوراق الحساسة
    On Error Resume Next
    ThisWorkbook.Worksheets("Dashboard").Visible = xlSheetVeryHidden
    ThisWorkbook.Worksheets("Debt_Alerts").Visible = xlSheetVeryHidden
    On Error GoTo 0
    
    Application.ScreenUpdating = True
    
    MsgBox "تم تهيئة نظام إدارة العملاء بنجاح!", vbInformation

End Sub

'=============================
'   إنشاء ورقة إذا لم تكن موجودة
'=============================
Sub CreateSheetIfNotExists(sheetName As String)

    On Error Resume Next
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(sheetName)
    
    If ws Is Nothing Then
        ThisWorkbook.Worksheets.Add.Name = sheetName
    End If
    On Error GoTo 0

End Sub

'=============================
'   إنشاء البيانات النموذجية
'=============================
Sub CreateSampleData()

    Dim wsSales As Worksheet
    Dim wsProducts As Worksheet
    Dim wsInvoice As Worksheet
    Dim wsDashboard As Worksheet
    
    Set wsSales = ThisWorkbook.Worksheets("Sales")
    Set wsProducts = ThisWorkbook.Worksheets("Products")
    Set wsInvoice = ThisWorkbook.Worksheets("Invoice")
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")
    
    ' إنشاء بيانات ورقة المبيعات إذا كانت فارغة
    If wsSales.Cells(2, 1).Value = "" Then
        Call PopulateSalesData(wsSales)
    End If
    
    ' إنشاء بيانات ورقة المنتجات إذا كانت فارغة
    If wsProducts.Cells(2, 1).Value = "" Then
        Call PopulateProductsData(wsProducts)
    End If
    
    ' إنشاء بيانات ورقة الفاتورة
    If wsInvoice.Cells(1, 1).Value = "" Then
        Call PopulateInvoiceHeaders(wsInvoice)
    End If
    
    ' إنشاء الداشبورد
    If wsDashboard.Cells(1, 1).Value = "" Then
        Call PopulateDashboard(wsDashboard, wsSales, wsProducts)
    End If

End Sub

'=============================
'   إنشاء الداشبورد
'=============================
Sub PopulateDashboard(wsDash As Worksheet, wsSales As Worksheet, wsProducts As Worksheet)

    Dim totalSales As Double
    Dim totalPaid As Double
    Dim totalDue As Double
    Dim i As Long
    Dim lastRow As Long
    
    ' تنسيق الورقة
    wsDash.PageSetup.PaperSize = xlPaperA4
    
    ' العنوان الرئيسي
    wsDash.Range("A1:F1").Merge
    wsDash.Cells(1, 1).Value = "🏪 لوحة تحكم نظام المبيعات"
    wsDash.Cells(1, 1).Font.Bold = True
    wsDash.Cells(1, 1).Font.Size = 20
    wsDash.Cells(1, 1).Font.Color = RGB(255, 255, 255)
    wsDash.Cells(1, 1).HorizontalAlignment = xlCenter
    wsDash.Cells(1, 1).Interior.Color = RGB(0, 51, 102)
    wsDash.Rows(1).RowHeight = 35
    
    ' العنوان الفرعي
    wsDash.Range("A2:F2").Merge
    wsDash.Cells(2, 1).Value = "خامات المنظفات والروايح والألوان"
    wsDash.Cells(2, 1).Font.Size = 12
    wsDash.Cells(2, 1).Font.Color = RGB(0, 51, 102)
    wsDash.Cells(2, 1).HorizontalAlignment = xlCenter
    wsDash.Rows(2).RowHeight = 20
    
    ' حساب الإجماليات
    lastRow = wsSales.Cells(wsSales.Rows.Count, 1).End(xlUp).Row
    totalSales = 0
    totalPaid = 0
    totalDue = 0
    
    For i = 2 To lastRow
        If IsNumericValue(wsSales.Cells(i, 7).Value) Then
            totalSales = totalSales + CDbl(wsSales.Cells(i, 7).Value)
        End If
        If IsNumericValue(wsSales.Cells(i, 8).Value) Then
            totalPaid = totalPaid + CDbl(wsSales.Cells(i, 8).Value)
        End If
        If IsNumericValue(wsSales.Cells(i, 9).Value) Then
            totalDue = totalDue + CDbl(wsSales.Cells(i, 9).Value)
        End If
    Next i
    
    ' بطاقة إجمالي المبيعات
    wsDash.Range("A4:C4").Merge
    wsDash.Cells(4, 1).Value = "إجمالي المبيعات"
    wsDash.Cells(4, 1).Font.Bold = True
    wsDash.Cells(4, 1).Font.Size = 14
    wsDash.Cells(4, 1).Interior.Color = RGB(0, 102, 204)
    wsDash.Cells(4, 1).Font.Color = RGB(255, 255, 255)
    wsDash.Cells(4, 1).HorizontalAlignment = xlCenter
    wsDash.Rows(4).RowHeight = 25
    
    wsDash.Range("A5:C5").Merge
    wsDash.Cells(5, 1).Value = Format(totalSales, "#,##0.00") & " جنيه"
    wsDash.Cells(5, 1).Font.Bold = True
    wsDash.Cells(5, 1).Font.Size = 16
    wsDash.Cells(5, 1).Interior.Color = RGB(200, 230, 255)
    wsDash.Cells(5, 1).HorizontalAlignment = xlCenter
    wsDash.Rows(5).RowHeight = 30
    
    ' بطاقة المبلغ المدفوع
    wsDash.Range("D4:F4").Merge
    wsDash.Cells(4, 4).Value = "المبلغ المدفوع"
    wsDash.Cells(4, 4).Font.Bold = True
    wsDash.Cells(4, 4).Font.Size = 14
    wsDash.Cells(4, 4).Interior.Color = RGB(0, 153, 76)
    wsDash.Cells(4, 4).Font.Color = RGB(255, 255, 255)
    wsDash.Cells(4, 4).HorizontalAlignment = xlCenter
    
    wsDash.Range("D5:F5").Merge
    wsDash.Cells(5, 4).Value = Format(totalPaid, "#,##0.00") & " جنيه"
    wsDash.Cells(5, 4).Font.Bold = True
    wsDash.Cells(5, 4).Font.Size = 16
    wsDash.Cells(5, 4).Interior.Color = RGB(200, 255, 200)
    wsDash.Cells(5, 4).HorizontalAlignment = xlCenter
    
    ' بطاقة المبلغ المتبقي
    wsDash.Range("A7:C7").Merge
    wsDash.Cells(7, 1).Value = "المبلغ المتبقي (الديون)"
    wsDash.Cells(7, 1).Font.Bold = True
    wsDash.Cells(7, 1).Font.Size = 14
    wsDash.Cells(7, 1).Interior.Color = RGB(204, 0, 0)
    wsDash.Cells(7, 1).Font.Color = RGB(255, 255, 255)
    wsDash.Cells(7, 1).HorizontalAlignment = xlCenter
    wsDash.Rows(7).RowHeight = 25
    
    wsDash.Range("A8:C8").Merge
    wsDash.Cells(8, 1).Value = Format(totalDue, "#,##0.00") & " جنيه"
    wsDash.Cells(8, 1).Font.Bold = True
    wsDash.Cells(8, 1).Font.Size = 16
    wsDash.Cells(8, 1).Interior.Color = RGB(255, 200, 200)
    wsDash.Cells(8, 1).HorizontalAlignment = xlCenter
    wsDash.Rows(8).RowHeight = 30
    
    ' عدد الفواتير والمنتجات
    wsDash.Range("D7:F7").Merge
    wsDash.Cells(7, 4).Value = "إحصائيات سريعة"
    wsDash.Cells(7, 4).Font.Bold = True
    wsDash.Cells(7, 4).Font.Size = 12
    wsDash.Cells(7, 4).Interior.Color = RGB(255, 153, 0)
    wsDash.Cells(7, 4).Font.Color = RGB(255, 255, 255)
    wsDash.Cells(7, 4).HorizontalAlignment = xlCenter
    
    wsDash.Cells(8, 4).Value = "عدد الفواتير:"
    wsDash.Cells(8, 4).Font.Bold = True
    wsDash.Cells(8, 5).Value = lastRow - 1
    wsDash.Cells(8, 5).Font.Bold = True
    wsDash.Cells(8, 5).Font.Size = 12
    
    wsDash.Cells(9, 4).Value = "عدد الأصناف:"
    wsDash.Cells(9, 4).Font.Bold = True
    wsDash.Cells(9, 5).Value = 9
    wsDash.Cells(9, 5).Font.Bold = True
    wsDash.Cells(9, 5).Font.Size = 12
    
    ' تنسيق الأعمدة
    wsDash.Columns("A:F").AutoFit

End Sub

'=============================
'   تعبئة بيانات المبيعات
'=============================
Sub PopulateSalesData(ws As Worksheet)

    Dim row As Long
    Dim col As Long
    
    ' رؤوس الأعمدة
    ws.Cells(1, 1).Value = "رقم الفاتورة"
    ws.Cells(1, 2).Value = "اسم العميل"
    ws.Cells(1, 3).Value = "تاريخ البيع"
    ws.Cells(1, 4).Value = "الصنف"
    ws.Cells(1, 5).Value = "الكمية"
    ws.Cells(1, 6).Value = "السعر/الوحدة"
    ws.Cells(1, 7).Value = "الإجمالي"
    ws.Cells(1, 8).Value = "المبلغ المدفوع"
    ws.Cells(1, 9).Value = "المتبقي"
    
    ' تنسيق الرؤوس - تصميم احترافي
    For col = 1 To 9
        ws.Cells(1, col).Font.Bold = True
        ws.Cells(1, col).Font.Size = 12
        ws.Cells(1, col).Font.Color = RGB(255, 255, 255)
        ws.Cells(1, col).Interior.ColorIndex = 5 ' أزرق
        ws.Cells(1, col).HorizontalAlignment = xlCenter
        ws.Cells(1, col).VerticalAlignment = xlCenter
    Next col
    
    ' البيانات - الفاتورة 1
    ws.Cells(2, 1).Value = "FV-001"
    ws.Cells(2, 2).Value = "محمود النجار"
    ws.Cells(2, 3).Value = Date
    ws.Cells(2, 3).NumberFormat = "dd/mm/yyyy"
    ws.Cells(2, 4).Value = "حمض الأستريك"
    ws.Cells(2, 5).Value = 10
    ws.Cells(2, 6).Formula = "=VLOOKUP(D2,Products.$A$2:$F$10,4,FALSE)"
    ws.Cells(2, 7).Formula = "=E2*F2"
    ws.Cells(2, 7).NumberFormat = "#,##0.00"
    ws.Cells(2, 8).Value = 200
    ws.Cells(2, 8).NumberFormat = "#,##0.00"
    ws.Cells(2, 9).Formula = "=G2-H2"
    ws.Cells(2, 9).NumberFormat = "#,##0.00"
    
    ' البيانات - الفاتورة 2
    ws.Cells(3, 1).Value = "FV-002"
    ws.Cells(3, 2).Value = "نور الدين"
    ws.Cells(3, 3).Value = Date - 1
    ws.Cells(3, 3).NumberFormat = "dd/mm/yyyy"
    ws.Cells(3, 4).Value = "رايحة الورد"
    ws.Cells(3, 5).Value = 5
    ws.Cells(3, 6).Formula = "=VLOOKUP(D3,Products.$A$2:$F$10,4,FALSE)"
    ws.Cells(3, 7).Formula = "=E3*F3"
    ws.Cells(3, 7).NumberFormat = "#,##0.00"
    ws.Cells(3, 8).Value = 250
    ws.Cells(3, 8).NumberFormat = "#,##0.00"
    ws.Cells(3, 9).Formula = "=G3-H3"
    ws.Cells(3, 9).NumberFormat = "#,##0.00"
    
    ' البيانات - الفاتورة 3
    ws.Cells(4, 1).Value = "FV-003"
    ws.Cells(4, 2).Value = "احمد محمود"
    ws.Cells(4, 3).Value = Date - 2
    ws.Cells(4, 3).NumberFormat = "dd/mm/yyyy"
    ws.Cells(4, 4).Value = "لون أزرق"
    ws.Cells(4, 5).Value = 8
    ws.Cells(4, 6).Formula = "=VLOOKUP(D4,Products.$A$2:$F$10,4,FALSE)"
    ws.Cells(4, 7).Formula = "=E4*F4"
    ws.Cells(4, 7).NumberFormat = "#,##0.00"
    ws.Cells(4, 8).Value = 280
    ws.Cells(4, 8).NumberFormat = "#,##0.00"
    ws.Cells(4, 9).Formula = "=G4-H4"
    ws.Cells(4, 9).NumberFormat = "#,##0.00"
    
    ' البيانات - الفاتورة 4
    ws.Cells(5, 1).Value = "FV-004"
    ws.Cells(5, 2).Value = "سمير"
    ws.Cells(5, 3).Value = Date - 3
    ws.Cells(5, 3).NumberFormat = "dd/mm/yyyy"
    ws.Cells(5, 4).Value = "صودا خفيفة"
    ws.Cells(5, 5).Value = 20
    ws.Cells(5, 6).Formula = "=VLOOKUP(D5,Products.$A$2:$F$10,4,FALSE)"
    ws.Cells(5, 7).Formula = "=E5*F5"
    ws.Cells(5, 7).NumberFormat = "#,##0.00"
    ws.Cells(5, 8).Value = 300
    ws.Cells(5, 8).NumberFormat = "#,##0.00"
    ws.Cells(5, 9).Formula = "=G5-H5"
    ws.Cells(5, 9).NumberFormat = "#,##0.00"
    
    ' البيانات - الفاتورة 5
    ws.Cells(6, 1).Value = "FV-005"
    ws.Cells(6, 2).Value = "ياسر"
    ws.Cells(6, 3).Value = Date - 4
    ws.Cells(6, 3).NumberFormat = "dd/mm/yyyy"
    ws.Cells(6, 4).Value = "رايحة الليمون"
    ws.Cells(6, 5).Value = 3
    ws.Cells(6, 6).Formula = "=VLOOKUP(D6,Products.$A$2:$F$10,4,FALSE)"
    ws.Cells(6, 7).Formula = "=E6*F6"
    ws.Cells(6, 7).NumberFormat = "#,##0.00"
    ws.Cells(6, 8).Value = 120
    ws.Cells(6, 8).NumberFormat = "#,##0.00"
    ws.Cells(6, 9).Formula = "=G6-H6"
    ws.Cells(6, 9).NumberFormat = "#,##0.00"
    
    ' تنسيق البيانات
    For row = 2 To 6
        For col = 1 To 9
            ws.Cells(row, col).HorizontalAlignment = xlCenter
            ws.Cells(row, col).Font.Size = 11
            If row Mod 2 = 0 Then
                ws.Cells(row, col).Interior.Color = RGB(242, 242, 242) ' رمادي فاتح
            Else
                ws.Cells(row, col).Interior.Color = RGB(255, 255, 255) ' أبيض
            End If
        Next col
    Next row
    
    ' تنسيق الأعمدة
    ws.Columns("A:I").AutoFit
    ws.Rows("1:1").RowHeight = 25

End Sub

'=============================
'   تعبئة بيانات المنتجات
'=============================
Sub PopulateProductsData(ws As Worksheet)

    Dim col As Long
    Dim row As Long
    
    ' رؤوس الأعمدة
    ws.Range("A1:F1").Interior.Color = RGB(0, 102, 204)
    ws.Cells(1, 1).Value = "رقم الصنف"
    ws.Cells(1, 2).Value = "اسم الصنف"
    ws.Cells(1, 3).Value = "النوع"
    ws.Cells(1, 4).Value = "السعر/الوحدة"
    ws.Cells(1, 5).Value = "الكمية المتاحة"
    ws.Cells(1, 6).Value = "الصنف النشط"
    
    ' تنسيق الرؤوس
    For col = 1 To 6
        ws.Cells(1, col).Font.Bold = True
        ws.Cells(1, col).Font.Color = RGB(255, 255, 255)
        ws.Cells(1, col).Font.Size = 12
        ws.Cells(1, col).HorizontalAlignment = xlCenter
    Next col
    
    ' البيانات - خامات منظفات
    ws.Cells(2, 1).Value = 1
    ws.Cells(2, 2).Value = "حمض الأستريك"
    ws.Cells(2, 3).Value = "خامة منظفات"
    ws.Cells(2, 4).Value = 25
    ws.Cells(2, 4).NumberFormat = "#,##0.00"
    ws.Cells(2, 5).Value = 150
    ws.Cells(2, 6).Value = "نشط"
    
    ws.Cells(3, 1).Value = 2
    ws.Cells(3, 2).Value = "ملح الطعام الناعم"
    ws.Cells(3, 3).Value = "خامة منظفات"
    ws.Cells(3, 4).Value = 8
    ws.Cells(3, 4).NumberFormat = "#,##0.00"
    ws.Cells(3, 5).Value = 200
    ws.Cells(3, 6).Value = "نشط"
    
    ws.Cells(4, 1).Value = 3
    ws.Cells(4, 2).Value = "صودا خفيفة"
    ws.Cells(4, 3).Value = "خامة منظفات"
    ws.Cells(4, 4).Value = 15
    ws.Cells(4, 4).NumberFormat = "#,##0.00"
    ws.Cells(4, 5).Value = 180
    ws.Cells(4, 6).Value = "نشط"
    
    ' البيانات - روايح
    ws.Cells(5, 1).Value = 4
    ws.Cells(5, 2).Value = "رايحة الورد"
    ws.Cells(5, 3).Value = "رايحة"
    ws.Cells(5, 4).Value = 50
    ws.Cells(5, 4).NumberFormat = "#,##0.00"
    ws.Cells(5, 5).Value = 80
    ws.Cells(5, 6).Value = "نشط"
    
    ws.Cells(6, 1).Value = 5
    ws.Cells(6, 2).Value = "رايحة الفراولة"
    ws.Cells(6, 3).Value = "رايحة"
    ws.Cells(6, 4).Value = 45
    ws.Cells(6, 4).NumberFormat = "#,##0.00"
    ws.Cells(6, 5).Value = 60
    ws.Cells(6, 6).Value = "نشط"
    
    ws.Cells(7, 1).Value = 6
    ws.Cells(7, 2).Value = "رايحة الليمون"
    ws.Cells(7, 3).Value = "رايحة"
    ws.Cells(7, 4).Value = 40
    ws.Cells(7, 4).NumberFormat = "#,##0.00"
    ws.Cells(7, 5).Value = 100
    ws.Cells(7, 6).Value = "نشط"
    
    ' البيانات - ألوان
    ws.Cells(8, 1).Value = 7
    ws.Cells(8, 2).Value = "لون أزرق"
    ws.Cells(8, 3).Value = "لون"
    ws.Cells(8, 4).Value = 35
    ws.Cells(8, 4).NumberFormat = "#,##0.00"
    ws.Cells(8, 5).Value = 120
    ws.Cells(8, 6).Value = "نشط"
    
    ws.Cells(9, 1).Value = 8
    ws.Cells(9, 2).Value = "لون أحمر"
    ws.Cells(9, 3).Value = "لون"
    ws.Cells(9, 4).Value = 35
    ws.Cells(9, 4).NumberFormat = "#,##0.00"
    ws.Cells(9, 5).Value = 95
    ws.Cells(9, 6).Value = "نشط"
    
    ws.Cells(10, 1).Value = 9
    ws.Cells(10, 2).Value = "لون أصفر"
    ws.Cells(10, 3).Value = "لون"
    ws.Cells(10, 4).Value = 30
    ws.Cells(10, 4).NumberFormat = "#,##0.00"
    ws.Cells(10, 5).Value = 110
    ws.Cells(10, 6).Value = "نشط"
    
    ' تنسيق البيانات
    For row = 2 To 10
        For col = 1 To 6
            ws.Cells(row, col).HorizontalAlignment = xlCenter
            ws.Cells(row, col).Font.Size = 11
            If row Mod 2 = 0 Then
                ws.Cells(row, col).Interior.Color = RGB(242, 242, 242)
            Else
                ws.Cells(row, col).Interior.Color = RGB(255, 255, 255)
            End If
        Next col
    Next row
    
    ' تنسيق الأعمدة
    ws.Columns("A:F").AutoFit
    ws.Rows("1:1").RowHeight = 25

End Sub

'=============================
'   تعبئة رؤوس الفاتورة
'=============================
Sub PopulateInvoiceHeaders(ws As Worksheet)

    Dim row As Long
    
    ' تنسيق الورقة
    ws.PageSetup.PaperSize = xlPaperA4
    ws.PageSetup.LeftMargin = 0.5
    ws.PageSetup.RightMargin = 0.5
    
    ' العنوان الرئيسي
    ws.Range("A1:F1").Merge
    ws.Cells(1, 1).Value = "فاتورة مبيعات"
    ws.Cells(1, 1).Font.Bold = True
    ws.Cells(1, 1).Font.Size = 18
    ws.Cells(1, 1).Font.Color = RGB(0, 51, 102)
    ws.Cells(1, 1).HorizontalAlignment = xlCenter
    ws.Cells(1, 1).Interior.Color = RGB(220, 230, 241)
    ws.Rows(1).RowHeight = 30
    
    ' معلومات الشركة
    ws.Cells(3, 1).Value = "خامات المنظفات والروايح والألوان"
    ws.Cells(3, 1).Font.Size = 12
    ws.Cells(3, 1).Font.Color = RGB(0, 51, 102)
    
    ' ===== بيانات الفاتورة =====
    ws.Cells(5, 1).Value = "رقم الفاتورة:"
    ws.Cells(5, 1).Font.Bold = True
    ws.Cells(5, 2).Value = "INV-001"
    ws.Cells(5, 2).Interior.Color = RGB(255, 255, 200)
    
    ws.Cells(5, 4).Value = "التاريخ:"
    ws.Cells(5, 4).Font.Bold = True
    ws.Cells(5, 5).Value = Date
    ws.Cells(5, 5).NumberFormat = "dd/mm/yyyy"
    ws.Cells(5, 5).Interior.Color = RGB(255, 255, 200)
    
    ' ===== بيانات العميل =====
    ws.Range("A7:F7").Interior.Color = RGB(0, 51, 102)
    ws.Cells(7, 1).Value = "بيانات العميل"
    ws.Cells(7, 1).Font.Bold = True
    ws.Cells(7, 1).Font.Color = RGB(255, 255, 255)
    
    ws.Cells(8, 1).Value = "اسم العميل:"
    ws.Cells(8, 1).Font.Bold = True
    ws.Cells(8, 2).Value = ""
    ws.Cells(8, 2).Interior.Color = RGB(242, 242, 242)
    
    ws.Cells(8, 4).Value = "رقم الهاتف:"
    ws.Cells(8, 4).Font.Bold = True
    ws.Cells(8, 5).Value = ""
    ws.Cells(8, 5).Interior.Color = RGB(242, 242, 242)
    
    ' ===== جدول المنتجات =====
    ws.Range("A10:F10").Interior.Color = RGB(0, 102, 204)
    ws.Cells(10, 1).Value = "الصنف"
    ws.Cells(10, 2).Value = "الكمية"
    ws.Cells(10, 3).Value = "السعر/الوحدة"
    ws.Cells(10, 4).Value = "الإجمالي"
    
    For row = 1 To 4
        ws.Cells(10, row).Font.Bold = True
        ws.Cells(10, row).Font.Color = RGB(255, 255, 255)
        ws.Cells(10, row).HorizontalAlignment = xlCenter
    Next row
    
    ' صفوف للمنتجات
    For row = 11 To 15
        ws.Cells(row, 1).Interior.Color = RGB(255, 255, 255)
        ws.Cells(row, 2).Interior.Color = RGB(255, 255, 255)
        ws.Cells(row, 3).Interior.Color = RGB(255, 255, 255)
        ws.Cells(row, 4).Interior.Color = RGB(255, 255, 255)
        ws.Cells(row, 2).NumberFormat = "0"
        ws.Cells(row, 3).NumberFormat = "#,##0.00"
        ws.Cells(row, 4).NumberFormat = "#,##0.00"
        ws.Cells(row, 4).Formula = "=B" & row & "*C" & row
    Next row
    
    ' ===== الإجماليات =====
    ws.Cells(17, 1).Value = "الإجمالي:"
    ws.Cells(17, 1).Font.Bold = True
    ws.Cells(17, 1).Font.Size = 12
    ws.Cells(17, 4).Formula = "=SUM(D11:D15)"
    ws.Cells(17, 4).Font.Bold = True
    ws.Cells(17, 4).Font.Size = 12
    ws.Cells(17, 4).Interior.Color = RGB(255, 200, 100)
    ws.Cells(17, 4).NumberFormat = "#,##0.00"
    
    ws.Cells(18, 1).Value = "المبلغ المدفوع:"
    ws.Cells(18, 1).Font.Bold = True
    ws.Cells(18, 2).Value = ""
    ws.Cells(18, 2).Interior.Color = RGB(200, 255, 200)
    ws.Cells(18, 2).NumberFormat = "#,##0.00"
    
    ws.Cells(19, 1).Value = "المتبقي:"
    ws.Cells(19, 1).Font.Bold = True
    ws.Cells(19, 1).Font.Size = 12
    ws.Cells(19, 4).Formula = "=D17-B18"
    ws.Cells(19, 4).Font.Bold = True
    ws.Cells(19, 4).Font.Size = 12
    ws.Cells(19, 4).Interior.Color = RGB(255, 150, 150)
    ws.Cells(19, 4).NumberFormat = "#,##0.00"
    
    ' ===== التوقيع =====
    ws.Cells(21, 1).Value = "توقيع العميل: _____________"
    ws.Cells(21, 1).Font.Size = 10
    ws.Cells(21, 4).Value = "توقيع البائع: _____________"
    ws.Cells(21, 4).Font.Size = 10
    
    ' تنسيق الأعمدة
    ws.Columns("A:F").AutoFit
    ws.Column("A").ColumnWidth = 20
    ws.Column("D").ColumnWidth = 15

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
        
    End If

End Sub

'=============================
'   تمكين وصول المدير
'=============================
Sub EnableManagerAccess()

    CreateSheetIfNotExists "Dashboard"
    CreateSheetIfNotExists "Sales"
    CreateSheetIfNotExists "Products"
    CreateSheetIfNotExists "Debt_Alerts"
    
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

    CreateSheetIfNotExists "Dashboard"
    CreateSheetIfNotExists "Sales"
    CreateSheetIfNotExists "Products"
    CreateSheetIfNotExists "Debt_Alerts"

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
    
    CreateSheetIfNotExists "Invoice"
    
    On Error Resume Next
    Set invoiceSheet = ThisWorkbook.Worksheets("Invoice")
    On Error GoTo 0
    
    If invoiceSheet Is Nothing Then
        MsgBox "ورقة الفاتورة غير موجودة", vbCritical
        Exit Sub
    End If
    
    ClientName = invoiceSheet.Cells(2, 2).Value
    
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
    
    CreateSheetIfNotExists "Sales"
    
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
    
    ' نسخ الرؤوس
    For i = 1 To 9
        reportSheet.Cells(1, i).Value = ws.Cells(1, i).Value
        reportSheet.Cells(1, i).Font.Bold = True
    Next i
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    rowReport = 2
    
    ' نسخ البيانات
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, 3).Value) Then
            If Month(ws.Cells(i, 3).Value) = monthNumber Then
                Dim col As Long
                For col = 1 To 9
                    reportSheet.Cells(rowReport, col).Value = ws.Cells(i, col).Value
                Next col
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
    Dim customerDue As String
    
    CreateSheetIfNotExists "Sales"
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Sales")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المبيعات غير موجودة", vbCritical
        Exit Sub
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    
    If lastRow < 2 Then
        MsgBox "لا توجد بيانات في ورقة المبيعات", vbInformation
        Exit Sub
    End If
    
    totalDebt = 0
    customerDue = ""
    
    For i = 2 To lastRow
        If IsNumericValue(ws.Cells(i, 9).Value) Then
            If CDbl(ws.Cells(i, 9).Value) > 0 Then
                totalDebt = totalDebt + CDbl(ws.Cells(i, 9).Value)
                customerDue = customerDue & ws.Cells(i, 2).Value & ": " & Format(ws.Cells(i, 9).Value, "0.00") & " جنيه" & vbCrLf
            End If
        End If
    Next i
    
    If totalDebt > 0 Then
        MsgBox "العملاء عليهم ديون:" & vbCrLf & vbCrLf & customerDue & vbCrLf & "الإجمالي: " & Format(totalDebt, "0.00") & " جنيه", vbExclamation, "تقرير الديون"
    Else
        MsgBox "لا توجد ديون معلقة - جميع الحسابات مستقرة", vbInformation, "تقرير الديون"
    End If

End Sub

'=============================
'   تنبيه المخزون المنخفض
'=============================
Sub LowStockAlert()

    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim alertText As String
    
    CreateSheetIfNotExists "Products"
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Products")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المنتجات غير موجودة", vbCritical
        Exit Sub
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    
    If lastRow < 2 Then
        MsgBox "لا توجد بيانات في ورقة المنتجات", vbInformation
        Exit Sub
    End If
    
    alertText = ""
    
    For i = 2 To lastRow
        If IsNumericValue(ws.Cells(i, 5).Value) Then
            If CDbl(ws.Cells(i, 5).Value) < 50 Then
                alertText = alertText & "• " & ws.Cells(i, 2).Value & " - الكمية المتاحة: " & ws.Cells(i, 5).Value & vbCrLf
            End If
        End If
    Next i
    
    If alertText <> "" Then
        MsgBox "تنبيه: الأصناف التالية بحاجة لإعادة تخزين:" & vbCrLf & vbCrLf & alertText, vbExclamation, "تنبيه المخزون"
    Else
        MsgBox "جميع الأصناف بمستويات مخزون آمنة - المخزون كافي", vbInformation, "حالة المخزون"
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

'=============================
'   تقرير المبيعات حسب الصنف
'=============================
Sub SalesReportByProduct()

    Dim ws As Worksheet
    Dim reportSheet As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim product As String
    Dim totalQty As Double
    Dim totalAmount As Double
    Dim rowReport As Long
    
    CreateSheetIfNotExists "Sales"
    
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Sales")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ورقة المبيعات غير موجودة", vbCritical
        Exit Sub
    End If
    
    ' حذف التقرير السابق إن وجد
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Worksheets("Sales_Report").Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    ' إنشاء ورقة جديدة للتقرير
    Set reportSheet = ThisWorkbook.Worksheets.Add
    reportSheet.Name = "Sales_Report"
    
    ' رؤوس التقرير
    reportSheet.Cells(1, 1).Value = "تقرير المبيعات حسب الصنف"
    reportSheet.Range("A1:D1").Merge
    reportSheet.Cells(1, 1).Font.Bold = True
    reportSheet.Cells(1, 1).Font.Size = 14
    
    reportSheet.Cells(3, 1).Value = "الصنف"
    reportSheet.Cells(3, 2).Value = "الكمية المباعة"
    reportSheet.Cells(3, 3).Value = "إجمالي المبيعات"
    reportSheet.Cells(3, 4).Value = "متوسط السعر"
    
    With reportSheet.Range("A3:D3")
        .Font.Bold = True
        .Interior.ColorIndex = 15
    End With
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    rowReport = 4
    
    ' حساب المبيعات لكل صنف
    For i = 2 To lastRow
        product = ws.Cells(i, 4).Value
        totalQty = 0
        totalAmount = 0
        Dim j As Long
        
        ' جمع البيانات لنفس الصنف
        For j = 2 To lastRow
            If ws.Cells(j, 4).Value = product Then
                If IsNumericValue(ws.Cells(j, 5).Value) Then
                    totalQty = totalQty + CDbl(ws.Cells(j, 5).Value)
                End If
                If IsNumericValue(ws.Cells(j, 7).Value) Then
                    totalAmount = totalAmount + CDbl(ws.Cells(j, 7).Value)
                End If
            End If
        Next j
        
        ' تجنب التكرار
        If Not IsProductInReport(reportSheet, product, rowReport) Then
            reportSheet.Cells(rowReport, 1).Value = product
            reportSheet.Cells(rowReport, 2).Value = totalQty
            reportSheet.Cells(rowReport, 3).Value = totalAmount
            reportSheet.Cells(rowReport, 3).NumberFormat = "#,##0.00"
            If totalQty > 0 Then
                reportSheet.Cells(rowReport, 4).Value = totalAmount / totalQty
                reportSheet.Cells(rowReport, 4).NumberFormat = "#,##0.00"
            End If
            rowReport = rowReport + 1
        End If
    Next i
    
    reportSheet.Columns("A:D").AutoFit
    MsgBox "تم إنشاء تقرير المبيعات بنجاح", vbInformation

End Sub

'=============================
'   دالة مساعدة: التحقق من الصنف في التقرير
'=============================
Function IsProductInReport(reportSheet As Worksheet, product As String, rowReport As Long) As Boolean

    Dim i As Long
    IsProductInReport = False
    
    For i = 4 To rowReport - 1
        If reportSheet.Cells(i, 1).Value = product Then
            IsProductInReport = True
            Exit For
        End If
    Next i

End Function

'=============================
'   فتح الفاتورة مع بيانات العميل
'=============================
Sub OpenInvoiceFromSales()

    Dim invoiceSheet As Worksheet
    Dim salesSheet As Worksheet
    Dim selectedRow As Long
    Dim customerName As String
    Dim invoiceNum As String
    Dim saleDate As String
    
    On Error Resume Next
    Set salesSheet = ThisWorkbook.Worksheets("Sales")
    Set invoiceSheet = ThisWorkbook.Worksheets("Invoice")
    On Error GoTo 0
    
    If salesSheet Is Nothing Or invoiceSheet Is Nothing Then
        MsgBox "الأوراق المطلوبة غير موجودة", vbCritical
        Exit Sub
    End If
    
    ' الحصول على السطر المختار
    selectedRow = ActiveCell.Row
    
    If selectedRow < 2 Then
        MsgBox "يرجى اختيار فاتورة من قائمة المبيعات", vbExclamation
        Exit Sub
    End If
    
    ' نقل البيانات إلى الفاتورة
    customerName = salesSheet.Cells(selectedRow, 2).Value
    invoiceNum = salesSheet.Cells(selectedRow, 1).Value
    saleDate = salesSheet.Cells(selectedRow, 3).Value
    
    ' ملء بيانات الفاتورة
    invoiceSheet.Cells(5, 2).Value = invoiceNum
    invoiceSheet.Cells(5, 5).Value = saleDate
    invoiceSheet.Cells(8, 2).Value = customerName
    invoiceSheet.Cells(17, 4).Value = salesSheet.Cells(selectedRow, 7).Value
    invoiceSheet.Cells(18, 2).Value = salesSheet.Cells(selectedRow, 8).Value
    invoiceSheet.Cells(19, 4).Value = salesSheet.Cells(selectedRow, 9).Value
    
    ' إظهار ورقة الفاتورة
    invoiceSheet.Visible = xlSheetVisible
    ThisWorkbook.Sheets("Invoice").Activate
    
    MsgBox "تم فتح الفاتورة بنجاح - " & customerName, vbInformation, "فاتورة العميل"

End Sub
