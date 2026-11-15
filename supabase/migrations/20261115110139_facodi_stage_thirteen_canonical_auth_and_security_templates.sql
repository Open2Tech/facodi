-- Source: Open2Tech/facodi branch facodi, updated for canonical www.facodi.com.
-- Templates are prepared for preview but not registered with project-global Supabase Auth.
INSERT INTO facodi.email_template_catalog (template_key,locale,subject,body_html,template_source_path,site_origin,delivery_enabled,review_status,version)
VALUES
('confirmation','pt-PT','FACODI | Confirme o seu email','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Confirme o seu endereço de email — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Confirmação da conta FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Confirme o seu endereço de email</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Recebemos um pedido de registo na FACODI. Confirme que este endereço de email lhe pertence para concluir a criação da conta.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:27px 0 24px"><tr><td bgcolor="#efff00" style="border-radius:7px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#efff00;border:2px solid #efff00;border-radius:7px;padding:13px 22px;color:#142846;text-decoration:none;font-size:15px;font-weight:700">Confirmar email</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#516177;margin:0 0 12px">Esta ligação é pessoal. Se o botão não abrir, tente a ligação no mesmo navegador em que iniciou o pedido.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não criou uma conta, pode ignorar esta mensagem. Não partilhe este link.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/confirmation.html','https://www.facodi.com',false,'ready',2),
('invite','pt-PT','FACODI | Convite para fazer parte','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Recebeu um convite — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Convite para aceder à FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Recebeu um convite</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi convidado a aceder à FACODI. Utilize o link abaixo para aceitar o convite e continuar o processo de acesso à plataforma.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:27px 0 24px"><tr><td bgcolor="#efff00" style="border-radius:7px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#efff00;border:2px solid #efff00;border-radius:7px;padding:13px 22px;color:#142846;text-decoration:none;font-size:15px;font-weight:700">Aceitar convite</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#516177;margin:0 0 12px">Esta ligação é pessoal. Se o botão não abrir, tente a ligação no mesmo navegador em que iniciou o pedido.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não esperava este convite, ignore esta mensagem. Não partilhe o link de acesso.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/invite.html','https://www.facodi.com',false,'ready',2),
('recovery','pt-PT','FACODI | Redefinir palavra-passe','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Redefinir palavra-passe — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Pedido de redefinição de palavra-passe FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Redefinir palavra-passe</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Recebemos um pedido para alterar a palavra-passe da sua conta FACODI. Utilize o link abaixo apenas se foi você quem fez este pedido.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:27px 0 24px"><tr><td bgcolor="#efff00" style="border-radius:7px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#efff00;border:2px solid #efff00;border-radius:7px;padding:13px 22px;color:#142846;text-decoration:none;font-size:15px;font-weight:700">Redefinir palavra-passe</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#516177;margin:0 0 12px">Esta ligação é pessoal. Se o botão não abrir, tente a ligação no mesmo navegador em que iniciou o pedido.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não pediu esta alteração, ignore a mensagem. A sua palavra-passe atual não será alterada por este email.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/recovery.html','https://www.facodi.com',false,'ready',2),
('magic_link','pt-PT','FACODI | A sua ligação de acesso','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>A sua ligação de acesso — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Ligação de acesso à FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">A sua ligação de acesso</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi pedida uma ligação para iniciar sessão na FACODI. Utilize-a apenas se foi você quem fez este pedido.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:27px 0 24px"><tr><td bgcolor="#efff00" style="border-radius:7px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#efff00;border:2px solid #efff00;border-radius:7px;padding:13px 22px;color:#142846;text-decoration:none;font-size:15px;font-weight:700">Iniciar sessão</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#516177;margin:0 0 12px">Esta ligação é pessoal. Se o botão não abrir, tente a ligação no mesmo navegador em que iniciou o pedido.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">A ligação é de utilização única. Não a partilhe. Se não pediu acesso, ignore esta mensagem.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/magic_link.html','https://www.facodi.com',false,'ready',2),
('email_change','pt-PT','FACODI | Confirme a alteração de email','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Confirmar alteração de email — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Confirmação de novo endereço de email na FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Confirmar alteração de email</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi pedida a alteração do endereço de email da sua conta FACODI para <strong>{{ .NewEmail }}</strong>. Confirme esta operação apenas se foi você quem a iniciou.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:27px 0 24px"><tr><td bgcolor="#efff00" style="border-radius:7px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#efff00;border:2px solid #efff00;border-radius:7px;padding:13px 22px;color:#142846;text-decoration:none;font-size:15px;font-weight:700">Confirmar alteração</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#516177;margin:0 0 12px">Esta ligação é pessoal. Se o botão não abrir, tente a ligação no mesmo navegador em que iniciou o pedido.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece este pedido, reveja imediatamente a segurança da sua conta.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/email_change.html','https://www.facodi.com',false,'ready',2),
('reauthentication','pt-PT','FACODI | Código de verificação','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Código de verificação — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Código de confirmação de segurança da FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Código de verificação</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Para confirmar uma operação sensível na sua conta FACODI, introduza o seguinte código de utilização única na página onde fez o pedido.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#eef8fb" style="padding:24px 12px;border:1px solid #b4dfe9;border-radius:8px;font-size:30px;letter-spacing:7px;line-height:1.5;font-weight:700;color:#142846;font-family:Consolas,monospace">{{ .Token }}</td></tr></table>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Não partilhe o código. A equipa FACODI nunca lhe pedirá este código por email ou telefone.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/reauthentication.html','https://www.facodi.com',false,'ready',2),
('password_changed','pt-PT','FACODI | Palavra-passe alterada','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>A palavra-passe foi alterada — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Aviso de segurança da conta FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">A palavra-passe foi alterada</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">A palavra-passe da sua conta FACODI foi alterada. Se efetuou a operação, não precisa de fazer mais nada.</p>
          
          <p style="margin:22px 0"><a href="https://www.facodi.com/auth/reset-password" style="color:#142846;text-decoration:underline;font-weight:600">Abrir recuperação de conta</a></p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece a alteração, procure recuperar o acesso à sua conta imediatamente.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/password_changed.html','https://www.facodi.com',false,'ready',2),
('email_changed','pt-PT','FACODI | Endereço de email alterado','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>O email da conta foi alterado — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Aviso de alteração de email da conta FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">O email da conta foi alterado</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">O endereço de email associado à sua conta FACODI foi alterado de <strong>{{ .OldEmail }}</strong> para <strong>{{ .Email }}</strong>.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece esta alteração, procure apoio através dos canais oficiais da FACODI.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/email_changed.html','https://www.facodi.com',false,'ready',2),
('phone_changed','pt-PT','FACODI | Número de telefone alterado','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>O número de telefone foi alterado — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Aviso de alteração de número da conta FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">O número de telefone foi alterado</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">O número de telefone da sua conta FACODI foi alterado de <strong>{{ .OldPhone }}</strong> para <strong>{{ .Phone }}</strong>.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece esta operação, reveja a segurança da conta.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/phone_changed.html','https://www.facodi.com',false,'ready',2),
('identity_linked','pt-PT','FACODI | Método de acesso associado','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Foi associado um método de acesso — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Novo método de acesso FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Foi associado um método de acesso</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi associado à sua conta FACODI um método de início de sessão do fornecedor <strong>{{ .Provider }}</strong>.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece esta operação, aceda à sua conta e reveja os métodos de autenticação.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/identity_linked.html','https://www.facodi.com',false,'ready',2),
('identity_unlinked','pt-PT','FACODI | Método de acesso removido','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Foi removido um método de acesso — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Alteração dos métodos de acesso FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Foi removido um método de acesso</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi removido da sua conta FACODI um método de início de sessão do fornecedor <strong>{{ .Provider }}</strong>.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece esta operação, reveja a segurança e os métodos de autenticação da sua conta.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/identity_unlinked.html','https://www.facodi.com',false,'ready',2),
('mfa_factor_enrolled','pt-PT','FACODI | Novo método de verificação','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Foi adicionado um método de verificação — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Novo método de verificação da FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Foi adicionado um método de verificação</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi ativado um novo método de verificação em dois passos (<strong>{{ .FactorType }}</strong>) na sua conta FACODI.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece esta alteração, entre na conta e reveja imediatamente a configuração de segurança.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/mfa_factor_enrolled.html','https://www.facodi.com',false,'ready',2),
('mfa_factor_unenrolled','pt-PT','FACODI | Método de verificação removido','<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Foi removido um método de verificação — FACODI</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#142846">
  <div style="display:none;font-size:1px;color:#f3f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Alteração de verificação na FACODI</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6f9">
    <tr><td align="center" style="padding:32px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #d9e3eb;border-radius:12px;background:#ffffff">
        <tr><td style="background:#142846;border-radius:11px 11px 0 0;padding:28px 32px;border-bottom:4px solid #efff00">
          <div style="font-size:25px;line-height:1.1;letter-spacing:1px;color:#ffffff;font-weight:800">FACODI</div>
          <div style="margin-top:6px;color:#efff00;font-size:12px;letter-spacing:1px;text-transform:uppercase">Faculdade Comunitária Digital</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#142846;font-weight:700">Foi removido um método de verificação</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#334966">Foi removido um método de verificação em dois passos (<strong>{{ .FactorType }}</strong>) da sua conta FACODI.</p>
          
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e0e8ed"><tr><td style="padding:19px 0 0">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5b6e83">Se não reconhece a alteração, reveja imediatamente a segurança da sua conta.</p>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-radius:0 0 11px 11px;border-top:1px solid #e4ebf0">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.65">Mensagem automática de segurança da FACODI. Não responda a este email nem envie palavras-passe ou códigos.</p>
          <p style="margin:9px 0 0;color:#64748b;font-size:12px;line-height:1.65"><a href="https://www.facodi.com" style="color:#254e7b;text-decoration:underline">Abrir FACODI</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
','supabase/email-templates/facodi/mfa_factor_unenrolled.html','https://www.facodi.com',false,'ready',2)
ON CONFLICT (template_key,locale) DO UPDATE
 SET subject=excluded.subject,
     body_html=excluded.body_html,
     template_source_path=excluded.template_source_path,
     site_origin=excluded.site_origin,
     review_status='ready',
     updated_at=now(),
     version=GREATEST(facodi.email_template_catalog.version+1,excluded.version)
WHERE facodi.email_template_catalog.subject IS DISTINCT FROM excluded.subject
   OR facodi.email_template_catalog.body_html IS DISTINCT FROM excluded.body_html
   OR facodi.email_template_catalog.site_origin IS DISTINCT FROM excluded.site_origin;