import React from 'react';

import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';

import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';

import { ThemedView } from '@/components/themed-view';

import { useThemeColor } from '@/hooks/use-theme-color';

import AppBackButton from '@/components/AppBackButton';



const logo = require('../../assets/images/vTailorlogo.jpeg');

const lehngaImage = require('../../dress_assets/lehanga.png');

const grarahImage = require('../../dress_assets/shrara.png');



const weddingDresses = [

  { id: 'lehnga', name: 'Lehngay', image: lehngaImage },

  { id: 'grarah', name: 'Grarah', image: grarahImage },

];



export default function WeddingDresses() {

  const router = useRouter();

  const tint = useThemeColor({}, 'tint');

  const card = useThemeColor({}, 'card');

  const inputBorder = useThemeColor({}, 'inputBorder');



  return (

    <ThemedView style={styles.container}>

      <View style={[styles.header, { backgroundColor: tint }]}>

        <AppBackButton onPress={() => (router as any).back()} variant="tint" />

        <ThemedText style={styles.headerTitle}>Wedding dress</ThemedText>

        <View style={styles.headerSpacer} />

      </View>



      <ScrollView contentContainerStyle={styles.grid}>

        {weddingDresses.map((dress) => (

          <Pressable

            key={dress.id}

            onPress={() => {

              if (dress.id === 'grarah') {
                (router as any).push({
                  pathname: '/customer/grarah-style',
                  params: { dressLine: 'wedding' },
                });
                return;
              }
              if (dress.id === 'lehnga') {
                (router as any).push({
                  pathname: '/customer/lehnga-style',
                  params: { dressLine: 'wedding' },
                });
                return;
              }
              (router as any).push({
                pathname: '/customer/customize3d',
                params: {
                  modelId: dress.id,
                  modelName: dress.name,
                  dressLine: 'wedding',
                },
              });

            }}

            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}

          >

            <Image source={dress.image || logo} style={styles.thumb} resizeMode="contain" />

            <ThemedText style={styles.dressName}>{dress.name}</ThemedText>

          </Pressable>

        ))}

      </ScrollView>

    </ThemedView>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1 },

  header: {

    paddingTop: 40,

    padding: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },

  headerSpacer: { width: 84 },

  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },

  grid: {

    padding: 12,

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

  },

  card: {

    width: '48%',

    borderRadius: 12,

    marginBottom: 12,

    overflow: 'hidden',

    alignItems: 'center',

    borderWidth: 1,

  },

  thumb: { width: '100%', height: 160 },

  dressName: { padding: 12, fontWeight: '600', textAlign: 'center' },

});

