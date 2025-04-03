import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generiert ein einfaches PDF-Dokument mit Teilnehmerinformationen.
 * 
 * @param {object} teilnehmer - Das Teilnehmerobjekt mit Daten (z.B. { id, vorname, nachname, email }).
 * @param {string} documentType - Der Typ des zu generierenden Dokuments (z.B. 'Bescheinigung').
 * @returns {Promise<Uint8Array>} Ein Promise, das mit dem Uint8Array der PDF-Bytes auflöst.
 */
export async function generatePdf(teilnehmer, documentType) {
  try {
    // Neues PDF-Dokument erstellen
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const padding = 50;

    // Einfacher Header
    page.drawText(`${documentType} für ${teilnehmer.vorname} ${teilnehmer.nachname}`, {
      x: padding,
      y: height - padding,
      font,
      size: fontSize + 6, // Größere Schrift für den Titel
      color: rgb(0, 0, 0),
    });

    // Teilnehmerdaten hinzufügen
    let yPosition = height - padding - 40;
    const lineHeight = fontSize + 5;

    page.drawText(`Teilnehmer-ID: ${teilnehmer.id}`, {
      x: padding,
      y: yPosition,
      font,
      size: fontSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPosition -= lineHeight;

    page.drawText(`Name: ${teilnehmer.vorname} ${teilnehmer.nachname}`, {
      x: padding,
      y: yPosition,
      font,
      size: fontSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPosition -= lineHeight;
    
    if (teilnehmer.email) {
        page.drawText(`Email: ${teilnehmer.email}`, {
            x: padding,
            y: yPosition,
            font,
            size: fontSize,
            color: rgb(0.1, 0.1, 0.1),
        });
        yPosition -= lineHeight;
    }
    
    // TODO: Hier weiteren Inhalt hinzufügen (Texte, Bilder, Tabellen etc.)
    // Beispiel:
    page.drawText('Dies ist eine automatisch generierte Bescheinigung.', {
        x: padding,
        y: yPosition - 20, // Etwas Abstand
        font,
        size: fontSize,
        color: rgb(0.1, 0.1, 0.1),
    });

    // PDF als Bytes speichern
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (error) {
    console.error("Fehler bei der PDF-Generierung:", error);
    throw new Error('PDF konnte nicht generiert werden.');
  }
}

// Beispiel für eine Funktion, die ein Template lädt (noch nicht implementiert)
/*
export async function fillPdfTemplate(templateBytes, data) {
  try {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Felder im Template ausfüllen (Namen müssen im PDF-Template übereinstimmen)
    // Beispiel:
    // const nameField = form.getTextField('teilnehmerName');
    // nameField.setText(`${data.vorname} ${data.nachname}`);
    
    // form.flatten(); // Optional: Formularfelder entfernen nach dem Füllen

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("Fehler beim Füllen des PDF-Templates:", error);
    throw new Error('PDF-Template konnte nicht gefüllt werden.');
  }
}
*/
