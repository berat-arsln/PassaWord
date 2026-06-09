 /* --------- SONUÇ EKRANI --------- */
      #sonucEkrani {
        background: radial-gradient(
          ellipse at 50% 20%,
          #0d2050 0%,
          #0a0e1a 80%
        );
        overflow-y: auto;
        justify-content: flex-start;
        align-items: center;
        padding-bottom: 32px;
      }
      .sonuc-header {
        text-align: center;
        padding: 28px 16px 16px;
        width: 100%;
      }
      .sonuc-header h2 {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: 2px;
      }
      .sonuc-puan {
        font-size: 56px;
        font-weight: 900;
        color: #ffd600;
        text-shadow: 0 0 24px rgba(255, 214, 0, 0.45);
        margin: 10px 0 4px;
        line-height: 1;
      }
      .sonuc-puan-etiket {
        color: var(--metin-soluk);
        font-size: 13px;
      }
      .sonuc-istatistik {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 14px;
        flex-wrap: wrap;
      }
      .istat-cipi {
        border-radius: 20px;
        padding: 7px 16px;
        font-size: 13px;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.09);
      }
      .istat-cipi.dogru {
        border-color: rgba(0, 230, 118, 0.4);
        color: #00e676;
      }
      .istat-cipi.yanlis {
        border-color: rgba(255, 23, 68, 0.4);
        color: #ff1744;
      }
      .istat-cipi.pas {
        border-color: rgba(255, 214, 0, 0.4);
        color: #ffd600;
      }
      .istat-cipi.bonus {
        border-color: rgba(79, 195, 247, 0.4);
        color: #4fc3f7;
      }
      .sonuc-liste {
        width: 100%;
        padding: 0 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .sonuc-kalem {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 11px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sonuc-harf {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 14px;
        flex-shrink: 0;
      }
      .sonuc-bilgi {
        flex: 1;
        min-width: 0;
      }
      .sonuc-soru {
        font-size: 12px;
        color: var(--metin-soluk);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sonuc-verilen-cevap {
        font-size: 13px;
        font-weight: 700;
        margin-top: 2px;
      }
      .sonuc-dogru-cevap {
        font-size: 11px;
        color: var(--metin-soluk);
        margin-top: 2px;
      }
      .hata-bildir-buton {
        background: rgba(255, 23, 68, 0.12);
        border: 1px solid rgba(255, 23, 68, 0.25);
        border-radius: 6px;
        color: #ff6b6b;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        cursor: pointer;
        margin-top: 4px;
        display: inline-block;
        letter-spacing: 0.5px;
      }
      .sonuc-kalem.s-dogru .sonuc-harf {
        background: rgba(0, 230, 118, 0.15);
        color: #00e676;
      }
      .sonuc-kalem.s-dogru .sonuc-verilen-cevap {
        color: #00e676;
      }
      .sonuc-kalem.s-yanlis .sonuc-harf {
        background: rgba(255, 23, 68, 0.15);
        color: #ff1744;
      }
      .sonuc-kalem.s-yanlis .sonuc-verilen-cevap {
        color: #ff1744;
      }
      .sonuc-kalem.s-pas .sonuc-harf {
        background: rgba(255, 214, 0, 0.15);
        color: #ffd600;
      }
      .sonuc-kalem.s-pas .sonuc-verilen-cevap {
        color: #ffd600;
      }
      .sonuc-butonlar {
        display: flex;
        gap: 12px;
        padding: 4px 14px 0;
        width: 100%;
      }
      .sonuc-butonlar button {
        flex: 1;
        height: 50px;
        border-radius: 13px;
        border: none;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.1s;
        letter-spacing: 0.5px;
      }
      .sonuc-butonlar button:active {
        transform: scale(0.96);
        opacity: 0.9;
      }
      #tekrarOynaButon {
        background: linear-gradient(145deg, #1976d2, #0d47a1);
        color: #fff;
        box-shadow: 0 4px 16px rgba(25, 118, 210, 0.35);
      }
      #anaSayfaButon {
        background: rgba(255, 65, 255, 0.47);
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #fff;
      }
      
      /* ========================================================================= */
      /* ERKEN BİTİR TUŞU                                                          */
      /* ========================================================================= */
      .erken-bitir-buton {
        background: rgba(255, 23, 68, 0.15);
        border: 1px solid rgba(255, 23, 68, 0.4);
        color: #ff4d4d;
        border-radius: 12px;
        padding: 8px 24px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 20px;
        letter-spacing: 1px;
        transition: all 0.2s;
        z-index: 10;
      }
      .erken-bitir-buton:active {
        transform: scale(0.95);
        background: rgba(255, 23, 68, 0.3);
      }

      /* Klavye açıldığında bu tuşu gizle */
      #oyunEkrani.klavye-acik .erken-bitir-buton {
        display: none !important;
      }


    </style>
