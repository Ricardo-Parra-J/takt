import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { CAMPOS_NUTRICIONALES, ValoresNutricionales } from '@/db/nutricion';

export function CamposNutricionales({
  valores,
  onChange,
}: {
  valores: ValoresNutricionales;
  onChange: (valores: ValoresNutricionales) => void;
}) {
  const theme = useTheme();

  function onCampoChange(key: keyof ValoresNutricionales, texto: string) {
    const limpio = texto.replace(',', '.');
    const numero = limpio.trim() === '' ? null : Number(limpio);
    onChange({ ...valores, [key]: numero != null && Number.isNaN(numero) ? valores[key] : numero });
  }

  return (
    <View style={styles.grid}>
      {CAMPOS_NUTRICIONALES.map((campo) => (
        <View key={campo.key} style={styles.campo}>
          <ThemedText type="small" themeColor="textSecondary">
            {campo.label} ({campo.unidad})
          </ThemedText>
          <TextInput
            value={valores[campo.key] == null ? '' : String(valores[campo.key])}
            onChangeText={(t) => onCampoChange(campo.key, t)}
            placeholder="—"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
        </View>
      ))}
    </View>
  );
}

export const VALORES_VACIOS: ValoresNutricionales = {
  calorias: null,
  proteinas_g: null,
  carbohidratos_g: null,
  grasas_g: null,
  fibra_g: null,
  azucares_g: null,
  sodio_mg: null,
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  campo: { width: '47%', gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 15,
  },
});
