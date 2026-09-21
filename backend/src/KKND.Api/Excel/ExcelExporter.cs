using ClosedXML.Excel;

namespace KKND.Api.Excel;

/// <summary>FR-DB-06 / FR-SE-05 / FR-AD-05 — one shared .xlsx builder for every "Export" button
/// in the app, so each report controller only needs to supply headers + rows.</summary>
public static class ExcelExporter
{
    public const string ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static byte[] Build(string sheetName, IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<object?>> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName);

        for (var col = 0; col < headers.Count; col++)
        {
            var cell = sheet.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#E5E7EB");
        }

        var rowIndex = 2;
        foreach (var row in rows)
        {
            for (var col = 0; col < row.Count; col++)
            {
                var value = row[col];
                var cell = sheet.Cell(rowIndex, col + 1);
                switch (value)
                {
                    case null:
                        break;
                    case DateOnly d:
                        cell.Value = d.ToDateTime(TimeOnly.MinValue);
                        cell.Style.DateFormat.Format = "dd/mm/yyyy";
                        break;
                    case DateTimeOffset dto:
                        cell.Value = dto.DateTime;
                        cell.Style.DateFormat.Format = "dd/mm/yyyy hh:mm";
                        break;
                    case decimal m:
                        cell.Value = m;
                        break;
                    case int i:
                        cell.Value = i;
                        break;
                    case bool b:
                        cell.Value = b ? "Yes" : "No";
                        break;
                    default:
                        cell.Value = value.ToString();
                        break;
                }
            }
            rowIndex++;
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
