import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import GlassmorphicCard from '../components/GlassmorphicCard';
import { predictCSV } from '../services/modelService';

export default function UploadScreen({ navigation, route }) {
  const { quickTest } = route?.params || {};
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          '*/*',
        ],
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setSelectedFile({
        name: asset.name,
        size: asset.size,
        uri: asset.uri,
        mimeType: asset.mimeType || 'text/csv',
      });

      // Upload to backend for prediction
      setLoading(true);
      try {
        const prediction = await predictCSV({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'text/csv',
        });

        if (prediction.success) {
          setPredictionResult(prediction);
          Alert.alert(
            'Analysis Complete',
            `Successfully analyzed ${prediction.summary.total_patients} patient(s). ` +
            `Found ${prediction.summary.pd_positive} with Parkinson's risk.`
          );
        } else {
          throw new Error(prediction.message || 'Prediction failed');
        }
      } catch (error) {
        console.error('Prediction error:', error);
        Alert.alert(
          'Analysis Failed',
          error.message || 'Could not analyze the file. Please ensure it has the correct format with 50 protein biomarkers.'
        );
        setSelectedFile(null);
        setPredictionResult(null);
      } finally {
        setLoading(false);
      }
    } catch (e) {
      console.error('File picker error:', e);
      Alert.alert('Upload failed', 'Could not read the file. Please try again.');
    }
  };

  const handleContinue = () => {
    if (!selectedFile || !predictionResult) {
      Alert.alert('Upload required', 'Please upload and analyze the proteomics file first.');
      return;
    }

    // Convert top biomarkers from prediction result
    const topBiomarkers = predictionResult.top_biomarkers?.slice(0, 10).map((bio, idx) => ({
      id: `protein-${idx + 1}`,
      name: bio.protein_name || bio.feature || bio.name || bio.name,
      symbol: (bio.feature || bio.name || `P${idx + 1}`).replace('seq_', '').toUpperCase().slice(0, 8),
      importance: bio.importance || bio.importance_normalized || 0,
      category: bio.category || 'Biomarker',
      description: `${bio.protein_name || bio.name} - Importance: ${(bio.importance || 0).toFixed(4)}`,
      direction: idx % 3 === 0 ? 'elevated' : 'decreased',
      value: bio.importance || 0,
    })) || [];

    // Calculate overall prediction stats (like Flask app)
    const totalPatients = predictionResult.summary.total_patients;
    const pdPositive = predictionResult.summary.pd_positive;
    const pdNegative = predictionResult.summary.pd_negative;
    
    // Calculate average probability across all patients
    const avgProbability = predictionResult.patients?.reduce((sum, p) => sum + p.probability, 0) / totalPatients || 0;
    const avgProbabilityDecimal = avgProbability / 100; // Convert to 0-1 range
    
    // Determine if overall result is positive (majority vote)
    const isPositive = pdPositive > pdNegative;
    
    // Calculate confidence based on how far average probability is from 0.5 (like Flask)
    const confidenceDelta = Math.abs(avgProbabilityDecimal - 0.5);
    let confidenceLevel = 'Low';
    if (confidenceDelta > 0.3) {
      confidenceLevel = 'High';
    } else if (confidenceDelta > 0.15) {
      confidenceLevel = 'Medium';
    }
    
    // Determine risk level based on average probability
    let riskLevel = 'Low';
    if (avgProbability >= 75) {
      riskLevel = 'Very High';
    } else if (avgProbability >= 60) {
      riskLevel = 'High';
    } else if (avgProbability >= 40) {
      riskLevel = 'Moderate';
    }
    
    // Create prediction object matching ResultScreen expectations
    const prediction = {
      isPositive: isPositive,
      confidence: avgProbabilityDecimal, // 0-1 range for display as percentage
      riskScore: avgProbabilityDecimal, // 0-1 range for risk meter
      riskLevel: riskLevel,
      probability: avgProbability, // 0-100 range
      totalPatients: totalPatients,
      pdPositive: pdPositive,
      pdNegative: pdNegative,
    };

    // Navigate to Result screen with prediction data
    navigation.navigate('Result', {
      prediction: prediction,
      predictionResult: predictionResult,
      fileName: selectedFile.name,
      biomarkers: topBiomarkers,
      topProteins: topBiomarkers,
    });
  };

  return (
    <LinearGradient
      colors={['#0A1628', '#1A2D4A', '#0F172A']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Upload Proteomics</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.subtitle}>
            Upload the Excel/CSV (50 features) before running analysis. We’ll extract top
            protein influencers and feed them to the AI model.
          </Text>

          <GlassmorphicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload" size={26} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Proteomics File</Text>
                <Text style={styles.cardSubtitle}>Excel (.xlsx/.csv) • 50 biomarkers</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.uploadButton} activeOpacity={0.9} onPress={handlePick} disabled={loading}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentDark]}
                style={styles.uploadButtonBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={COLORS.white} />
                    <Text style={styles.uploadText}>Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="document-attach" size={20} color={COLORS.white} />
                    <Text style={styles.uploadText}>
                      {selectedFile ? 'Replace & Re-analyze' : 'Upload & Analyze CSV'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {selectedFile && predictionResult && (
              <View style={styles.fileInfo}>
                <View style={styles.fileRow}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                </View>
                <Text style={styles.fileMeta}>
                  {predictionResult.summary.total_patients} patient(s) analyzed • 
                  {' '}{predictionResult.summary.pd_positive} PD positive • 
                  {' '}{predictionResult.summary.pd_negative} healthy
                </Text>
              </View>
            )}
          </GlassmorphicCard>

          <GlassmorphicCard style={styles.card}>
            <View style={styles.miniHeader}>
              <Ionicons name="analytics" size={20} color={COLORS.accent} />
              <Text style={styles.miniTitle}>What we do</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bullet}>Upload CSV with 50 protein biomarkers</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bullet}>Real-time ML prediction using LightGBM model</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bullet}>Feature importance analysis for each patient</Text>
            </View>
          </GlassmorphicCard>

          <TouchableOpacity 
            style={[styles.continueButton, (!selectedFile || !predictionResult || loading) && styles.disabledButton]} 
            activeOpacity={0.9} 
            onPress={handleContinue}
            disabled={!selectedFile || !predictionResult || loading}
          >
            <LinearGradient
              colors={(!selectedFile || !predictionResult || loading) ? ['#555', '#444'] : [COLORS.accent, COLORS.accentDark]}
              style={styles.continueBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueText}>View Results</Text>
              <Ionicons name="arrow-forward-circle" size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footer}>Designed and Developed by Manav Rai • All Rights Reserved</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: SIZES.lg },
  content: {
    padding: SIZES.lg,
    paddingTop: SIZES.xl * 1.2,
    gap: SIZES.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.large,
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  placeholder: { width: 42 },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginTop: SIZES.sm,
  },
  card: {
    padding: SIZES.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    gap: SIZES.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.35)',
  },
  cardTitle: {
    fontSize: SIZES.large,
    fontWeight: '800',
    color: COLORS.white,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  uploadButton: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  uploadButtonBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  uploadText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: SIZES.regular,
  },
  fileInfo: {
    marginTop: SIZES.md,
    padding: SIZES.md,
    backgroundColor: 'rgba(0, 212, 170, 0.06)',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.12)',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  fileMeta: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SIZES.sm,
  },
  miniTitle: {
    fontWeight: '800',
    color: COLORS.white,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    color: COLORS.white,
    flex: 1,
    fontWeight: '600',
  },
  continueButton: {
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: SIZES.regular,
  },
  footer: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: SIZES.sm,
  },
});

