import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SIZES, SHADOWS } from '../theme';

interface PolicyText {
  title: string;
  lastUpdated: string;
  sections: {
    title: string;
    content: string;
  }[];
}

const POLICY_TRANSLATIONS: Record<string, PolicyText> = {
  tr: {
    title: 'Gizlilik Politikası',
    lastUpdated: 'Son Güncelleme: Temmuz 2026',
    sections: [
      {
        title: '1. Giriş',
        content: 'FreshTrack gizliliğinizi korumayı taahhüt eder. Bu Gizlilik Politikası, FreshTrack mobil uygulamasını kullandığınızda bilgilerinizin nasıl işlendiğini açıklar. Uygulamamızı kullanarak bu politikayı kabul etmiş olursunuz.',
      },
      {
        title: '2. Veri Toplama ve %100 Yerel Depolama',
        content: 'FreshTrack, gizliliğe son derece önem veren bir uygulamadır. Girdiğiniz tüm veriler (ürün adları, son kullanma tarihleri, ilaç listeleri, doz bilgileri, notlar ve kullanım kayıtları gibi) AsyncStorage kullanılarak tamamen cihazınızda yerel olarak saklanır. Bu verileri harici hiçbir sunucuya iletmeyiz, toplamayız veya saklamayız. Verileriniz tamamen sizin kontrolünüzdedir.',
      },
      {
        title: '3. Cihaz İzinleri',
        content: 'Uygulamanın işlevlerini yerine getirebilmesi için aşağıdaki izinler gereklidir:\n\n• Kamera: Yalnızca ürün barkodlarını tarayarak ürün bilgilerini otomatik olarak getirmek amacıyla yerel olarak kullanılır. Kamera görüntüleriniz veya verileriniz hiçbir sunucuya yüklenmez.\n• Bildirimler ve Alarmlar: Tarihi yaklaşan ürünleriniz ve ilaç kullanım saatleriniz için hatırlatıcı bildirimler göndermek amacıyla kullanılır.',
      },
      {
        title: '4. Üçüncü Taraf Hizmetleri (Reklamlar)',
        content: 'Ücretsiz kullanıcılarımıza uygulamayı ücretsiz sunabilmek amacıyla Google AdMob entegrasyonu kullanmaktayız. AdMob, onayınıza ve uygulama mağazası yönergelerine bağlı olarak kişiselleştirilmiş veya kişiselleştirilmemiş reklamlar göstermek için cihaz tanımlayıcılarını (Google Reklam Kimliği veya iOS IDFA gibi) toplayabilir.',
      },
      {
        title: '5. Veri Güvenliği ve Silme',
        content: 'Verileriniz yalnızca yerel cihazınızda depolandığı için uygulamayı silmeniz durumunda FreshTrack üzerindeki tüm verileriniz kalıcı olarak silinir. Yerel yedekleme/geri yükleme özelliğini kullanarak verilerinizi kendi kontrolünüzdeki güvenli bir dosyaya yedekleyebilirsiniz.',
      },
      {
        title: '6. İletişim',
        content: 'Bu politika veya uygulamamız hakkında herhangi bir sorunuz olması durumunda, uygulamanın "Ayarlar" sayfasında bulunan "Geri Bildirim" bölümü üzerinden bizimle iletişime geçebilirsiniz.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: July 2026',
    sections: [
      {
        title: '1. Introduction',
        content: 'FreshTrack is committed to protecting your privacy. This Privacy Policy describes how your information is handled when you use the FreshTrack mobile application. By using our app, you agree to this policy.',
      },
      {
        title: '2. Data Collection & 100% Local Storage',
        content: 'FreshTrack prioritizes user privacy. All data you enter (such as product names, expiration dates, medications, dosages, notes, and logs) is stored locally on your device using AsyncStorage. We do not transmit, collect, or store this data on any external servers. Your data remains entirely yours.',
      },
      {
        title: '3. Device Permissions',
        content: 'The following permissions are required for the app to function properly:\n\n• Camera: Used purely locally to scan barcodes to retrieve product information. No camera data is collected, stored, or uploaded.\n• Notifications & Alarms: Used to send reminders for expiring products and scheduled medication times.',
      },
      {
        title: '4. Third-Party Services (Advertising)',
        content: 'For free users, we use Google AdMob to display banner advertisements. AdMob may collect and use device identifiers (like the Google Advertising ID or iOS IDFA) to serve personalized or non-personalized advertisements, subject to your consent and app store privacy guidelines.',
      },
      {
        title: '5. Data Security & Deletion',
        content: 'Since all data is stored locally, deleting the app will permanently delete all your stored data. The backup and restore feature allows you to export your data to a local file which you control entirely.',
      },
      {
        title: '6. Contact Us',
        content: 'If you have questions about this privacy policy, you can contact us via the Feedback section in the Settings screen of the app.',
      },
    ],
  },
  de: {
    title: 'Datenschutzerklärung',
    lastUpdated: 'Zuletzt aktualisiert: Juli 2026',
    sections: [
      {
        title: '1. Einleitung',
        content: 'FreshTrack verpflichtet sich, Ihre Privatsphäre zu schützen. Diese Datenschutzerklärung beschreibt, wie mit Ihren Informationen umgegangen wird, wenn Sie die mobile Anwendung FreshTrack nutzen. Mit der Nutzung unserer App stimmen Sie dieser Richtlinie zu.',
      },
      {
        title: '2. Datenerfassung & 100% lokale Speicherung',
        content: 'FreshTrack legt großen Wert auf den Schutz der Nutzerdaten. Alle von Ihnen eingegebenen Daten (wie Produktnamen, Verfallsdaten, Medikamente, Dosierungen, Notizen und Protokolle) werden mithilfe von AsyncStorage lokal auf Ihrem Gerät gespeichert. Wir übertragen, erfassen oder speichern diese Daten nicht auf externen Servern. Ihre Daten gehören ausschließlich Ihnen.',
      },
      {
        title: '3. Geräteberechtigungen',
        content: 'Die folgenden Berechtigungen sind erforderlich, damit die App ordnungsgemäß funktioniert:\n\n• Kamera: Wird ausschließlich lokal verwendet, um Barcodes zu scannen und Produktinformationen abzurufen. Es werden keine Kameradaten erfasst, gespeichert oder hochgeladen.\n• Benachrichtigungen & Alarme: Wird verwendet, um Erinnerungen an ablaufende Produkte und geplante Medikamentenzeiten zu senden.',
      },
      {
        title: '4. Dienste von Drittanbietern (Werbung)',
        content: 'Für kostenlose Benutzer verwenden wir Google AdMob zur Anzeige von Bannerwerbung. AdMob kann Geräte-IDs (wie die Google-Werbe-ID oder iOS-IDFA) erfassen und verwenden, um personalisierte oder nicht personalisierte Werbung anzuzeigen, vorbehaltlich Ihrer Einwilligung und den Richtlinien des App Stores.',
      },
      {
        title: '5. Datensicherheit & Löschung',
        content: 'Da alle Daten lokal gespeichert werden, werden durch das Löschen der App alle Ihre gespeicherten Daten dauerhaft gelöscht. Mit der Backup- und Wiederherstellungsfunktion können Sie Ihre Daten in eine lokale Datei exportieren, die Sie vollständig kontrollieren.',
      },
      {
        title: '6. Kontaktieren Sie uns',
        content: 'Wenn Sie Fragen zu dieser Datenschutzerklärung haben, können Sie uns über den Bereich Feedback in den Einstellungen der App kontaktieren.',
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: Julio 2026',
    sections: [
      {
        title: '1. Introducción',
        content: 'FreshTrack se compromete a proteger su privacidad. Esta Política de Privacidad describe cómo se maneja su información cuando utiliza la aplicación móvil FreshTrack. Al utilizar nuestra aplicación, acepta esta política.',
      },
      {
        title: '2. Recopilación de datos y almacenamiento 100% local',
        content: 'FreshTrack prioriza la privacidad del usuario. Todos los datos que ingresa (como nombres de productos, fechas de vencimiento, medicamentos, dosis, notas y registros) se almacenan localmente en su dispositivo mediante AsyncStorage. No transmitimos, recopilamos ni almacenamos estos datos en servidores externos. Sus datos son completamente suyos.',
      },
      {
        title: '3. Permisos del dispositivo',
        content: 'Se requieren los siguientes permisos para que la aplicación funcione correctamente:\n\n• Cámara: Se usa únicamente de forma local para escanear códigos de barras y obtener información sobre productos. No se recopilan, almacenan ni cargan datos de la cámara.\n• Notificaciones y alarmas: Se utilizan para enviar recordatorios de productos que vencen y horarios programados de medicamentos.',
      },
      {
        title: '4. Servicios de terceros (Publicidad)',
        content: 'Para los usuarios gratuitos, utilizamos Google AdMob para mostrar anuncios de banner. AdMob puede recopilar y utilizar identificadores de dispositivos (como el ID de publicidad de Google o IDFA de iOS) para mostrar anuncios personalizados o no personalizados, según su consentimiento y las directrices de privacidad de la tienda de aplicaciones.',
      },
      {
        title: '5. Seguridad y eliminación de datos',
        content: 'Dado que todos los datos se almacenan localmente, al eliminar la aplicación se eliminarán permanentemente todos sus datos almacenados. La función de copia de seguridad y restauración le permite exportar sus datos a un archivo local que usted controla por completo.',
      },
      {
        title: '6. Contáctenos',
        content: 'Si tiene preguntas sobre esta política de privacidad, puede contactarnos a través de la sección de Comentarios en la pantalla de Configuración de la aplicación.',
      },
    ],
  },
  fr: {
    title: 'Politique de Confidentialité',
    lastUpdated: 'Dernière mise à jour : Juillet 2026',
    sections: [
      {
        title: '1. Introduction',
        content: 'FreshTrack s\'engage à protéger votre vie privée. Cette politique de confidentialité décrit comment vos informations sont gérées lorsque vous utilisez l\'application mobile FreshTrack. En utilisant notre application, vous acceptez cette politique.',
      },
      {
        title: '2. Collecte de données & Stockage 100% local',
        content: 'FreshTrack donne la priorité à la vie privée des utilisateurs. Toutes les données que vous saisissez (telles que les noms de produits, les dates de péremption, les médicaments, les dosages, les notes et les journaux) sont stockées localement sur votre appareil à l\'aide d\'AsyncStorage. Nous ne transmettons, ne collectons ni ne stockons ces données sur des serveurs externes. Vos données restent entièrement les vôtres.',
      },
      {
        title: '3. Autorisations de l\'appareil',
        content: 'Les autorisations suivantes sont requises pour le bon fonctionnement de l\'application :\n\n• Appareil photo : utilisé uniquement localement pour scanner les codes-barres afin de récupérer les informations sur le produit. Aucune donnée d\'appareil photo n\'est collectée, stockée ou téléchargée.\n• Notifications & Alarmes : utilisées pour envoyer des rappels pour les produits expirant et les heures de prise de médicaments programmées.',
      },
      {
        title: '4. Services tiers (Publicité)',
        content: 'Pour les utilisateurs gratuits, nous utilisons Google AdMob pour afficher des bannières publicitaires. AdMob peut collecter et utiliser des identifiants d\'appareil (tels que l\'identifiant publicitaire Google ou l\'IDFA iOS) pour diffuser des publicités personnalisées ou non personnalisées, sous réserve de votre consentement et des directives de confidentialité de l\'App Store.',
      },
      {
        title: '5. Sécurité & Suppression des données',
        content: 'Étant donné que toutes les données sont stockées localement, la suppression de l\'application supprimera définitivement toutes vos données stockées. La fonction de sauvegarde et de restauration vous permet d\'exporter vos données vers un fichier local que vous contrôlez entièrement.',
      },
      {
        title: '6. Contactez-nous',
        content: 'Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter via la section Commentaires dans l\'écran Paramètres de l\'application.',
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    lastUpdated: '最終更新日: 2026年7月',
    sections: [
      {
        title: '1. はじめに',
        content: 'FreshTrackは、お客様のプライバシーを保護することをお約束します。このプライバシーポリシーは、お客様がFreshTrackモバイルアプリケーションを使用する際の情報処理方法を説明するものです。アプリを使用することにより、本ポリシーに同意したものとみなされます。',
      },
      {
        title: '2. データの収集と100%ローカル保存',
        content: 'FreshTrackはユーザーのプライバシーを最優先します。入力されたすべてのデータ（製品名、賞味期限、薬品、用量、メモ、ログなど）は、AsyncStorageを使用してデバイスのローカルにのみ保存されます。これらのデータを外部のサーバーに送信、収集、または保存することはありません。お客様のデータは完全にあなたのものです。',
      },
      {
        title: '3. デバイスの権限',
        content: 'アプリが正常に機能するには、以下の権限が必要です：\n\n• カメラ：バーコードをスキャンして製品情報を取得するためにのみローカルで使用されます。カメラデータが収集、保存、またはアップロードされることはありません。\n• 通知とアラーム：賞味期限の近づいた製品や服薬スケジュールの通知を送信するために使用されます。',
      },
      {
        title: '4. サードパーティサービス（広告）',
        content: '無料版のユーザー向けに、バナー広告を表示するためにGoogle AdMobを使用しています。AdMobは、同意およびアプリストアのプライバシーガイドラインに従って、パーソナライズ広告または非パーソナライズ広告を配信するために、デバイス識別子（Google広告IDやiOSのIDFAなど）を収集および使用する場合があります。',
      },
      {
        title: '5. データのセキュリティと削除',
        content: 'すべてのデータはローカルに保存されるため、アプリを削除すると、保存されているすべてのデータが完全に削除されます。バックアップと復元機能を使用すると、完全に管理下にあるローカルファイルにデータをエクスポートできます。',
      },
      {
        title: '6. お問い合わせ',
        content: 'このプライバシーポリシーについてご質問がある場合は、アプリの設定画面にあるフィードバックセクションからお問い合わせください。',
      },
    ],
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年7月',
    sections: [
      {
        title: '1. 简介',
        content: 'FreshTrack 致力于保护您的隐私。本隐私政策说明了当您使用 FreshTrack 移动应用程序时，您的信息是如何被处理的。使用我们的应用程序即表示您同意本政策。',
      },
      {
        title: '2. 数据收集与 100% 本地存储',
        content: 'FreshTrack 优先保护用户隐私。您输入的所有数据（例如产品名称、过期日期、药物、剂量、备注和日志）均使用 AsyncStorage 本地存储在您的设备上。我们不会在任何外部服务器上传输、收集或存储这些数据。您的数据完全属于您自己。',
      },
      {
        title: '3. 设备权限',
        content: '为了使应用程序正常运行，需要以下权限：\n\n• 相机：仅在本地用于扫描条形码以获取产品信息。不收集、存储或上传任何相机数据。\n• 通知与警报：用于发送过期产品和设定服药时间的提醒。',
      },
      {
        title: '4. 第三方服务（广告）',
        content: '对于免费用户，我们使用 Google AdMob 显示横幅广告。AdMob 可能会根据您的同意和应用商店的隐私指南，收集并使用设备标识符（例如 Google 广告 ID 或 iOS IDFA）来投放个性化或非个性化广告。',
      },
      {
        title: '5. 数据安全与删除',
        content: '由于所有数据都存储在本地，删除应用将永久删除所有存储的数据。备份和恢复功能允许您将数据导出到完全由您控制的本地文件中。',
      },
      {
        title: '6. 联系我们',
        content: '如果您对本隐私政策有任何疑问，可以通过应用程序“设置”屏幕中的“反馈”部分与我们联系。',
      },
    ],
  },
};

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();

  const policy = POLICY_TRANSLATIONS[currentLanguage] || POLICY_TRANSLATIONS.en;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.secondary }]}>{policy.title}</Text>
          <Text style={[styles.updatedText, { color: colors.textLight }]}>{policy.lastUpdated}</Text>
        </View>

        {policy.sections.map((section, idx) => (
          <View key={idx} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.text }]}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: SIZES.md,
    gap: 12,
  },
  headerCard: {
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    ...SHADOWS.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  updatedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    ...SHADOWS.sm,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
